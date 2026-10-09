import { Effect } from "effect"
import { effectCmd } from "../effect-cmd"
import { UI } from "../ui"
import { Global } from "@anymous-ai/core/global"

type Status = "pass" | "warn" | "fail"

interface Check {
  id: string
  label: string
  status: Status
  message: string
}

const icon = (status: Status) => (status === "pass" ? "pass" : status === "warn" ? "warn" : "fail")

export const DoctorCommand = effectCmd({
  command: "doctor",
  describe: "check setup, credentials and connectivity, reporting pass/warn/fail",
  builder: (yargs) =>
    yargs.option("json", {
      describe: "print the report as JSON",
      type: "boolean",
      default: false,
    }),
  instance: false,
  handler: Effect.fn("Cli.doctor")(function* (args) {
    const checks: Check[] = []

    // Runtime versions.
    const bunVersion = process.versions.bun ?? "missing"
    checks.push({
      id: "runtime-bun",
      label: "Bun runtime",
      status: process.versions.bun ? "pass" : "fail",
      message: process.versions.bun ? `bun ${bunVersion}` : "not running under Bun",
    })
    try {
      const node = Bun.spawnSync(["node", "--version"])
      checks.push({
        id: "runtime-node",
        label: "Node.js",
        status: node.exitCode === 0 ? "pass" : "warn",
        message: node.exitCode === 0 ? `node ${node.stdout.toString().trim()}` : "node not on PATH (needed for npm wrapper shims)",
      })
    } catch {
      checks.push({ id: "runtime-node", label: "Node.js", status: "warn", message: "node not on PATH" })
    }

    // Writable data/cache/config dirs.
    for (const [id, dir] of [
      ["dir-data", Global.Path.data],
      ["dir-cache", Global.Path.cache],
      ["dir-config", Global.Path.config],
    ] as const) {
      const probe = yield* Effect.promise(async () => {
        await Bun.write(`${dir}/.anymous-doctor-write-test`, "ok")
        await Bun.file(`${dir}/.anymous-doctor-write-test`).unlink()
      }).pipe(
        Effect.as({ ok: true as const }),
        Effect.catch(() => Effect.succeed({ ok: false as const })),
      )
      checks.push({
        id,
        label: `writable ${dir}`,
        status: probe.ok ? "pass" : "fail",
        message: probe.ok ? "ok" : "not writable",
      })
    }

    // Credentials configured (auth.json or provider env keys).
    const { Auth } = yield* Effect.promise(() => import("@/auth"))
    const authSvc = yield* Auth.Service
    const stored = Object.keys(yield* Effect.orDie(authSvc.all()))
    const envHit = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "OPENROUTER_API_KEY", "GITHUB_TOKEN"].find(
      (name) => !!process.env[name],
    )
    checks.push({
      id: "credentials",
      label: "Provider credentials",
      status: stored.length > 0 || envHit ? "pass" : "warn",
      message:
        stored.length > 0
          ? `stored: ${stored.join(", ")}`
          : envHit
            ? `via env: ${envHit}`
            : "none — run `anymous auth login` or set a provider API key",
    })

    // Models catalog reachable (short probe, warn-only).
    const probe = yield* Effect.tryPromise({
      try: async () => {
        const res = await fetch("https://models.dev/api.json", { method: "HEAD", signal: AbortSignal.timeout(8000) })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      },
      catch: (error) => error,
    }).pipe(
      Effect.as({ ok: true as const, message: "ok" }),
      Effect.catch((error: unknown) =>
        Effect.succeed({ ok: false as const, message: error instanceof Error ? error.message : String(error) }),
      ),
    )
    checks.push({
      id: "models-catalog",
      label: "models.dev reachable",
      status: probe.ok ? "pass" : "warn",
      message: probe.ok ? "ok" : probe.message,
    })

    if (args.json) {
      process.stdout.write(
        JSON.stringify({ generatedAt: new Date().toISOString(), ok: checks.every((c) => c.status !== "fail"), checks }, null, 2) + "\n",
      )
      return
    }

    UI.empty()
    for (const check of checks) {
      process.stdout.write(`${icon(check.status)} ${check.label}: ${check.message}\n`)
    }
    UI.empty()
    const failed = checks.filter((c) => c.status === "fail").length
    const warned = checks.filter((c) => c.status === "warn").length
    process.stdout.write(
      failed > 0 ? `${failed} failing, ${warned} warnings\n` : warned > 0 ? `${warned} warnings\n` : "all checks passed\n",
    )
  }),
})

export * as DoctorCli from "./doctor"
