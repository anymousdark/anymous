import type { Argv } from "yargs"
import { UI } from "../ui"
import { $ } from "bun"
import os from "os"
import path from "path"

interface VoiceArgs {
  text?: string[]
  listen?: number
  loop?: boolean
  agent: string
}

const voiceDir = path.join(os.homedir(), ".local", "share", "anymous", "voice")

async function speak(text: string) {
  const clean = text.replace(/\s+/g, " ").trim()
  if (!clean) return
  await $`bash ${path.join(voiceDir, "speak.sh")} ${clean}`.quiet().catch(() => {})
}

async function listen(secs: number): Promise<string> {
  const out = await $`bash ${path.join(voiceDir, "listen.sh")} ${String(secs)}`.quiet().nothrow()
  return out.text().trim()
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
        default: "any",
      }),
  handler: async (args: VoiceArgs) => {
    if (args.text && args.text.length > 0) {
      await speak(args.text.join(" "))
      return
    }

    const runOnce = async () => {
      UI.println("🎤 a ouvir... fala agora")
      const heard = await listen(args.listen ?? 5)
      if (!heard) {
        UI.println("(nada ouvido)")
        return
      }
      UI.println(`👂 ouviste: ${heard}`)
      const answer =
        await $`anymous run --agent ${args.agent} ${heard}`.quiet().nothrow().then((r) => r.text().trim())
      UI.println(`🤖 Any: ${answer}`)
      await speak(answer)
    }

    if (args.loop) {
      UI.println("🔁 modo voz contínuo (Ctrl+C para sair)")
      for (;;) await runOnce()
      return
    }

    await runOnce()
  },
}
