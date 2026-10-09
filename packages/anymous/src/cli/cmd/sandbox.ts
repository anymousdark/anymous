import type { Argv } from "yargs"
import { Effect } from "effect"
import { SandboxGrants } from "@anymous-ai/core/sandbox-grants"
import { cmd } from "./cmd"
import { CliError, effectCmd, fail } from "../effect-cmd"
import { UI } from "../ui"

const prettyScope = (scope?: string, kind?: string) =>
  !scope ? "(global)" : kind ? `${kind}:${scope}` : scope

// SandboxGrants methods fail with plain Errors; CLI handlers must surface
// CliError so the top-level formatter prints them cleanly.
const cliError = <A>(effect: Effect.Effect<A, unknown>) =>
  effect.pipe(Effect.mapError((err) => new CliError({ message: err instanceof Error ? err.message : String(err) })))

const SandboxListCommand = effectCmd({
  command: "list",
  aliases: ["ls"],
  describe: "list stored tool grants and command prefix grants",
  instance: false,
  handler: Effect.fn("Cli.sandbox.list")(function* (_args) {
    const svc = yield* SandboxGrants.Service
    const grants = yield* cliError(svc.list())
    const prefixes = yield* cliError(svc.prefixes())

    UI.empty()
    for (const grant of grants) {
      const session = grant.session ? " (session)" : ""
      const reason = grant.reason ? ` — ${grant.reason}` : ""
      process.stdout.write(
        `${grant.decision === "allow" ? "allow" : "deny"} ${grant.toolName} ${prettyScope(grant.scope, grant.scopeKind)}${session}${reason}\n`,
      )
    }
    for (const prefix of prefixes) {
      const session = prefix.session ? " (session)" : ""
      process.stdout.write(
        `${prefix.decision === "allow" ? "allow" : "deny"} ${prefix.toolName} [${prefix.prefix.join(" ")}]${session}\n`,
      )
    }
    UI.empty()
    process.stdout.write(`${grants.length} grants, ${prefixes.length} prefix grants\n`)
  }),
})

const grantOptions = (yargs: Argv) =>
  yargs
    .positional("tool", { describe: "tool name (e.g. bash, read, edit)", type: "string", demandOption: true })
    .option("scope", {
      describe: "scope the grant applies to (path, host, or command scope)",
      type: "string",
    })
    .option("kind", {
      describe: "scope kind",
      choices: ["file", "dir", "host", ""] as const,
      type: "string",
    })
    .option("reason", { describe: "why this grant exists", type: "string" })
    .option("session", {
      describe: "grant lasts only for the current session",
      type: "boolean",
      default: false,
    })

const SandboxAllowCommand = effectCmd({
  command: "allow <tool>",
  describe: "pre-approve a tool, optionally narrowed to a scope",
  builder: grantOptions,
  instance: false,
  handler: Effect.fn("Cli.sandbox.allow")(function* (args) {
    const svc = yield* SandboxGrants.Service
    yield* cliError(
      svc.grant({
        toolName: args.tool,
        decision: "allow",
        scope: args.scope,
        scopeKind: args.kind as "file" | "dir" | "host" | "" | undefined,
        reason: args.reason,
        session: args.session || undefined,
      }),
    )
    UI.println(`${UI.Style.TEXT_SUCCESS_BOLD}allowed${UI.Style.TEXT_NORMAL} ${args.tool} ${prettyScope(args.scope, args.kind)}`)
  }),
})

const SandboxDenyCommand = effectCmd({
  command: "deny <tool>",
  describe: "pre-deny a tool, optionally narrowed to a scope",
  builder: grantOptions,
  instance: false,
  handler: Effect.fn("Cli.sandbox.deny")(function* (args) {
    const svc = yield* SandboxGrants.Service
    yield* cliError(
      svc.grant({
        toolName: args.tool,
        decision: "deny",
        scope: args.scope,
        scopeKind: args.kind as "file" | "dir" | "host" | "" | undefined,
        reason: args.reason,
        session: args.session || undefined,
      }),
    )
    UI.println(`${UI.Style.TEXT_DANGER_BOLD}denied${UI.Style.TEXT_NORMAL} ${args.tool} ${prettyScope(args.scope, args.kind)}`)
  }),
})

const SandboxAllowPrefixCommand = effectCmd({
  command: "allow-prefix <tool> <command..>",
  describe: "pre-approve a tool only for commands starting with the given prefix (e.g. bash npm test)",
  builder: (yargs: Argv) =>
    yargs
      .positional("tool", { describe: "tool name", type: "string", demandOption: true })
      .positional("command", { describe: "command prefix words", type: "string", array: true, demandOption: true })
      .option("session", { describe: "grant lasts only for the current session", type: "boolean", default: false }),
  instance: false,
  handler: Effect.fn("Cli.sandbox.allowPrefix")(function* (args) {
    const svc = yield* SandboxGrants.Service
    const prefix = (args.command ?? []).filter((word): word is string => typeof word === "string")
    if (prefix.length === 0) return yield* fail("command prefix must not be empty")
    yield* cliError(
      svc.grantPrefix({ toolName: args.tool, decision: "allow", prefix, session: args.session || undefined }),
    )
    UI.println(
      `${UI.Style.TEXT_SUCCESS_BOLD}allowed${UI.Style.TEXT_NORMAL} ${args.tool} [${prefix.join(" ")}]`,
    )
  }),
})

const SandboxRevokeCommand = effectCmd({
  command: "revoke <tool>",
  describe: "remove stored grants for a tool (optionally limited to a scope)",
  builder: (yargs: Argv) =>
    yargs
      .positional("tool", { describe: "tool name", type: "string", demandOption: true })
      .option("scope", { describe: "only revoke grants for this scope", type: "string" }),
  instance: false,
  handler: Effect.fn("Cli.sandbox.revoke")(function* (args) {
    const svc = yield* SandboxGrants.Service
    const removed = yield* cliError(svc.revoke(args.tool, args.scope))
    UI.println(removed ? `revoked ${args.tool}${args.scope ? ` (${args.scope})` : ""}` : "nothing to revoke")
  }),
})

const SandboxClearCommand = effectCmd({
  command: "clear",
  describe: "remove all stored grants",
  instance: false,
  handler: Effect.fn("Cli.sandbox.clear")(function* (_args) {
    const svc = yield* SandboxGrants.Service
    yield* cliError(svc.clear())
    UI.println("cleared all grants")
  }),
})

export const SandboxCommand = cmd({
  command: "sandbox",
  describe: "manage pre-approved tool grants (persistent sandbox permissions)",
  builder: (yargs: Argv) =>
    yargs
      .command(SandboxListCommand)
      .command(SandboxAllowCommand)
      .command(SandboxDenyCommand)
      .command(SandboxAllowPrefixCommand)
      .command(SandboxRevokeCommand)
      .command(SandboxClearCommand)
      .demandCommand(),
  async handler() {},
})

export * as SandboxCli from "./sandbox"
