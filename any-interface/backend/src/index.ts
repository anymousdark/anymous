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

// --- CLI bridge: corre o anymous e devolve a resposta ---
app.post("/api/ask", async (c) => {
  const { text, agent } = await c.req.json<{ text: string; agent?: string }>()
  if (!text?.trim()) return c.json({ error: "empty" }, 400)
  const proc = await $`${ANYMOUS} run --agent ${agent ?? "any"} ${text}`
    .cwd(ANYMOUS_DIR)
    .quiet()
    .nothrow()
  const answer = proc.text().trim()
  if (proc.exitCode !== 0 || !answer) {
    const err = proc.text().trim() || "provedor instável — tenta de novo em 1 min"
    return c.json({ answer: "", error: err.slice(0, 300) }, 502)
  }
  return c.json({ answer })
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
