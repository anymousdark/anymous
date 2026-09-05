import type { Argv } from "yargs"
import { UI } from "../ui"
import { $ } from "bun"
import os from "os"
import path from "path"
import fs from "fs"

interface VoiceArgs {
  text?: string[]
  listen?: number
  loop?: boolean
  agent: string
  model: string
}

const voiceDir = path.join(os.homedir(), ".local", "share", "anymous", "voice")

function checkVoiceDeps(): string | undefined {
  for (const f of ["speak.sh", "listen.sh", "listen.py"]) {
    if (!fs.existsSync(path.join(voiceDir, f))) return `em falta: ${path.join(voiceDir, f)}`
  }
  return undefined
}

function resolveAnymous(): string {
  for (const dir of (process.env.PATH ?? "").split(":")) {
    const bin = path.join(dir, "anymous")
    if (fs.existsSync(bin)) return bin
  }
  return "anymous"
}

async function speak(text: string): Promise<boolean> {
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 500)
  if (!clean) return true
  const r = await $`bash ${path.join(voiceDir, "speak.sh")} ${clean}`.quiet().nothrow()
  if (r.exitCode !== 0) {
    UI.println(`(TTS falhou: ${r.text().trim().slice(0, 120)})`)
    return false
  }
  return true
}

async function listen(secs: number): Promise<{ text: string; ok: boolean }> {
  const r = await $`bash ${path.join(voiceDir, "listen.sh")} ${String(secs)}`.quiet().nothrow()
  if (r.exitCode !== 0) return { text: "", ok: false }
  return { text: r.text().trim(), ok: true }
}

export const VoiceCommand = {
  command: "voice [text..]",
  describe: "talk with Any by voice (pt-BR, offline)",
  builder: (yargs: Argv) =>
    yargs
      .positional("text", {
        describe: "text to speak out loud",
        type: "string",
        array: true,
      })
      .option("listen", {
        alias: "l",
        type: "number",
        describe: "record mic for N seconds and transcribe",
      })
      .option("loop", {
        type: "boolean",
        describe: "continuous voice loop: listen -> Any -> speak (Ctrl+C to stop)",
        default: false,
      })
      .option("agent", {
        alias: "a",
        type: "string",
        describe: "agent to answer in loop mode",
        default: "build",
      })
      .option("model", {
        alias: "m",
        type: "string",
        describe: "model in provider/model format",
        default: "nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
      }),
  handler: async (args: VoiceArgs) => {
    const missing = checkVoiceDeps()
    if (missing) {
      UI.println(`Voz indisponível — ${missing}`)
      UI.println("Vê packages/anymous/voice/README.md para instalar.")
      return
    }
    if (!/^[\w-]+$/.test(args.agent)) {
      UI.println(`Agente inválido: ${args.agent}`)
      return
    }
    if (args.text && args.text.length > 0) {
      await speak(args.text.join(" "))
      return
    }

    const anymousBin = resolveAnymous()
    let fails = 0
    const runOnce = async (): Promise<boolean> => {
      UI.println("🎤 a ouvir... fala agora")
      const heard = await listen(args.listen ?? 5)
      if (!heard.ok) {
        UI.println("(mic/STT falhou — verifica o microfone)")
        return false
      }
      if (!heard.text) {
        UI.println("(nada ouvido)")
        await Bun.sleep(1000)
        return true
      }
      UI.println(`👂 ouviste: ${heard.text}`)
      const r = await $`${anymousBin} run --agent ${args.agent} --model ${args.model} -- ${heard.text}`
        .quiet()
        .nothrow()
        .timeout(120_000)
      const answer = r.text().trim()
      if (r.exitCode !== 0 || !answer) {
        UI.println("(Any sem resposta — provedor instável?)")
        return false
      }
      UI.println(`🤖 Any: ${answer}`)
      await speak(answer)
      return true
    }

    if (args.loop) {
      UI.println("🔁 modo voz contínuo (Ctrl+C para sair)")
      for (;;) {
        const ok = await runOnce().catch((e) => {
          UI.println(`(erro: ${String(e).slice(0, 120)})`)
          return false
        })
        fails = ok ? 0 : fails + 1
        if (fails >= 3) {
          UI.println("A abortar após 3 falhas seguidas.")
          break
        }
        await Bun.sleep(500)
      }
      return
    }

    await runOnce()
  },
}
