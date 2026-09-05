import { Hono } from "hono"
import { serveStatic } from "hono/bun"
import { $ } from "bun"
import os from "os"
import path from "path"

const app = new Hono()
const ANYMOUS = process.env.ANYMOUS_BIN ?? "anymous"
const ANYMOUS_API = process.env.ANYMOUS_API ?? "http://127.0.0.1:4096"
const ANYMOUS_DIR =
  process.env.ANYMOUS_DIR ?? "/home/aycher/Documentos/Default Project/anymous-ia"
const VOICE = path.join(os.homedir(), ".local", "share", "anymous", "voice")

// --- Servidor anymous persistente (sem cold start por turno) ---
const sessions = new Map<string, string>()
async function api(path: string, init?: RequestInit) {
  const sep = path.includes("?") ? "&" : "?"
  const r = await fetch(`${ANYMOUS_API}${path}${sep}directory=${encodeURIComponent(ANYMOUS_DIR)}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(180_000),
  })
  if (!r.ok) throw new Error(`anymous ${r.status}: ${(await r.text()).slice(0, 200)}`)
  return r.json()
}
async function sessionFor(agent: string): Promise<string> {
  const hit = sessions.get(agent)
  if (hit) return hit
  const s = (await api(`/session`, { method: "POST", body: JSON.stringify({ title: `Any HUD (${agent})` }) })) as {
    id: string
  }
  sessions.set(agent, s.id)
  return s.id
}
function textOf(msg: any): string {
  const parts = msg?.parts ?? []
  return parts
    .filter((p: any) => p?.type === "text" && p.text)
    .map((p: any) => p.text)
    .join("\n")
    .trim()
}

// modelos que funcionam (curadoria: testados e a responder)
const MODELS = [
  { id: "nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", label: "Nemotron Omni (NVIDIA, key)" },
  { id: "opencode/nemotron-3-ultra-free", label: "Nemotron Ultra (free)" },
  { id: "opencode/muse-spark-1.3-contributor-free", label: "Muse Spark (free)" },
  { id: "opencode/muse-spark-1.2-contributor-free", label: "Muse Spark 1.2 (free)" },
]
const DEFAULT_MODEL = MODELS[0].id
app.get("/api/models", (c) => c.json({ models: MODELS, default: DEFAULT_MODEL }))

// --- pergunta ao Any (sessão reutilizada, rápido) ---
app.post("/api/ask", async (c) => {
  const { text, agent, model } = await c.req.json<{ text: string; agent?: string; model?: string }>()
  if (!text?.trim()) return c.json({ error: "empty" }, 400)
  const name = /^[\w-]+$/.test(agent ?? "") ? agent! : "any"
  const [providerID, ...rest] = String(model || DEFAULT_MODEL).split("/")
  const modelID = rest.join("/")
  if (!providerID || !modelID) return c.json({ answer: "", error: "modelo inválido" }, 400)
  try {
    const id = await sessionFor(`${name}@${providerID}/${modelID}`)
    const msg = (await api(`/session/${id}/message`, {
      method: "POST",
      body: JSON.stringify({
        agent: name,
        model: { providerID, modelID },
        parts: [{ type: "text", text: text.slice(0, 2000) }],
      }),
    })) as any
    const answer = textOf(msg)
    if (!answer) return c.json({ answer: "", error: "resposta vazia — tenta de novo" }, 502)
    return c.json({ answer })
  } catch (e) {
    return c.json({ answer: "", error: String((e as Error)?.message ?? e).slice(0, 300) }, 502)
  }
})

// --- nova conversa (limpa sessão do agente) ---
app.post("/api/reset", async (c) => {
  const { agent } = await c.req.json<{ agent?: string }>().catch(() => ({} as any))
  sessions.delete(agent ?? "any")
  return c.json({ ok: true })
})

// --- agentes disponíveis ---
app.get("/api/agents", async (c) => {
  const proc = await $`${ANYMOUS} agent list`.cwd(ANYMOUS_DIR).quiet().nothrow()
  const agents = proc
    .text()
    .split("\n")
    .map((l) => l.trim().match(/^([\w-]+)\s+\((\w+)\)$/))
    .filter(Boolean)
    .map((m) => ({ name: m![1], mode: m![2] }))
  return c.json({ agents })
})

// --- TTS: texto -> wav (piper pt-BR) ---
app.post("/api/speak", async (c) => {
  const { text } = await c.req.json<{ text: string }>()
  await $`bash ${path.join(VOICE, "speak.sh")} ${text ?? ""}`.quiet().nothrow()
  const wav = Bun.file("/tmp/any-speak.wav")
  return new Response(wav, { headers: { "content-type": "audio/wav" } })
})

// --- STT: audio upload -> texto (whisper) ---
app.post("/api/listen", async (c) => {
  const body = await c.req.parseBody()
  const audio = body["audio"]
  if (!(audio instanceof File)) return c.json({ error: "no audio" }, 400)
  await Bun.write("/tmp/any-ui-listen.webm", audio)
  await $`ffmpeg -y -i /tmp/any-ui-listen.webm -ar 16000 -ac 1 /tmp/any-ui-listen.wav`
    .quiet()
    .nothrow()
  const out =
    await $`${path.join(VOICE, "venv", "bin", "python")} ${path.join(VOICE, "listen.py")} /tmp/any-ui-listen.wav`
      .quiet()
      .nothrow()
  return c.json({ text: out.text().trim() })
})

// --- projetos e sessões existentes do CLI ---
app.get("/api/projects", async (c) => {
  try {
    return c.json(await api(`/project`))
  } catch (e) {
    return c.json({ error: String((e as Error)?.message ?? e).slice(0, 200) }, 502)
  }
})
app.get("/api/sessions", async (c) => {
  const dir = c.req.query("directory") ?? ANYMOUS_DIR
  try {
    const r = await fetch(
      `${ANYMOUS_API}/session?directory=${encodeURIComponent(dir)}&limit=50`,
      { signal: AbortSignal.timeout(30_000) },
    )
    if (!r.ok) throw new Error(`anymous ${r.status}`)
    return c.json(await r.json())
  } catch (e) {
    return c.json({ error: String((e as Error)?.message ?? e).slice(0, 200) }, 502)
  }
})

// --- métricas reais do sistema ---
app.get("/api/system", (c) => {
  const load = os.loadavg()[0] ?? 0
  const cores = os.cpus().length || 1
  const total = os.totalmem()
  const free = os.freemem()
  return c.json({
    cpu: Math.min(100, Math.round((load / cores) * 100)),
    mem: Math.round(((total - free) / total) * 100),
    uptime: Math.round(os.uptime()),
    time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
  })
})

// --- estado do backend anymous ---
app.get("/api/health", async (c) => {
  try {
    const r = await fetch(`${ANYMOUS_API}/api/health`)
    return c.json({ anymous: r.ok })
  } catch {
    return c.json({ anymous: false })
  }
})

// --- frontend estático ---
app.use("/*", serveStatic({ root: "../frontend" }))

const port = Number(process.env.PORT ?? 4123)
console.log(`Any interface em http://127.0.0.1:${port}`)
export default { port, fetch: app.fetch }
