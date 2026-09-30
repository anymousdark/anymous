export * as SandboxGrants from "./sandbox-grants"

import { Context, Effect, Layer, Schema } from "effect"
import { makeGlobalNode } from "./effect/app-node"
import { FSUtil } from "./fs-util"
import { Global } from "./global"
import path from "path"

/**
 * Persistent tool grants, ported from zero's sandbox engine
 * (github.com/Gitlawb/zero internal/sandbox/grants.go + command_prefix.go).
 *
 * Lets power users pre-approve narrow scopes instead of "allow *" or
 * answering every prompt: e.g. allow `bash` only for `npm test`,
 * or allow `read` everywhere except secrets.
 */

export const ScopeKind = Schema.Literals(["file", "dir", "host", ""])
export type ScopeKind = typeof ScopeKind.Type

export const Decision = Schema.Literals(["allow", "deny"])
export type Decision = typeof Decision.Type

export class Grant extends Schema.Class<Grant>("SandboxGrant")({
  toolName: Schema.String,
  scope: Schema.optional(Schema.String),
  scopeKind: Schema.optional(ScopeKind),
  decision: Decision,
  approvedAt: Schema.String,
  reason: Schema.optional(Schema.String),
  session: Schema.optional(Schema.Boolean),
}) {}

export class CommandPrefixGrant extends Schema.Class<CommandPrefixGrant>("SandboxCommandPrefixGrant")({
  toolName: Schema.String,
  prefix: Schema.Array(Schema.String),
  decision: Decision,
  approvedAt: Schema.String,
  session: Schema.optional(Schema.Boolean),
}) {}

const StoreFile = Schema.Struct({
  schemaVersion: Schema.Literal(3),
  grants: Schema.Record(Schema.String, Schema.Array(Grant)),
  commandPrefixes: Schema.optional(Schema.Record(Schema.String, Schema.Array(CommandPrefixGrant))),
})
type StoreFile = Schema.Schema.Type<typeof StoreFile>

const emptyStore = (): StoreFile => ({ schemaVersion: 3 as const, grants: {}, commandPrefixes: {} })

function hasStringPrefix(values: string[], prefix: string[]): boolean {
  if (prefix.length === 0 || prefix.length > values.length) return false
  return prefix.every((part, i) => values[i] === part)
}

export interface GrantInput {
  toolName: string
  decision: Decision
  reason?: string
  scope?: string
  scopeKind?: ScopeKind
  session?: boolean
}

export interface Interface {
  readonly list: () => Effect.Effect<Grant[]>
  readonly prefixes: () => Effect.Effect<CommandPrefixGrant[]>
  readonly grant: (input: GrantInput) => Effect.Effect<void>
  readonly grantPrefix: (
    input: Omit<GrantInput, "scope" | "scopeKind"> & { prefix: string[] },
  ) => Effect.Effect<void>
  readonly revoke: (toolName: string, scope?: string) => Effect.Effect<boolean>
  readonly clear: () => Effect.Effect<void>
  readonly lookup: (toolName: string, scope?: string) => Effect.Effect<Grant | undefined>
  readonly lookupPrefix: (toolName: string, command: string[]) => Effect.Effect<CommandPrefixGrant | undefined>
}

export class Service extends Context.Service<Service, Interface>()("@anymous/SandboxGrants") {}

const storePath = () => process.env.ANYMOUS_GRANTS_PATH ?? path.join(Global.Path.data, "sandbox-grants.json")

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const fs = yield* FSUtil.Service

    const load = Effect.fnUntraced(function* (): Effect.Effect<StoreFile> {
      const raw = yield* fs.readJson(storePath()).pipe(Effect.catch(() => Effect.succeed(undefined)))
      if (!raw || typeof raw !== "object") return emptyStore()
      const parsed = yield* Schema.decodeUnknownOption(StoreFile)(raw).pipe(
        Effect.catch(() => Effect.succeed(undefined)),
      )
      return parsed ?? emptyStore()
    })

    const save = Effect.fnUntraced(function* (store: StoreFile) {
      const tmp = `${storePath()}.${process.pid}.tmp`
      yield* fs.writeWithDirs(tmp, JSON.stringify(store, null, 2))
      yield* fs.rename(tmp, storePath()).pipe(
        Effect.catch(() => fs.writeWithDirs(storePath(), JSON.stringify(store, null, 2)).pipe(Effect.asVoid)),
      )
    })

    const normScope = (scope: string | undefined, kind: ScopeKind | undefined) => {
      if (!scope) return { scope: undefined, scopeKind: undefined as ScopeKind | undefined }
      if (kind === "host") return { scope: scope.toLowerCase(), scopeKind: kind }
      if (kind === "file" || kind === "dir") return { scope: path.resolve(scope), scopeKind: kind }
      return { scope, scopeKind: kind }
    }

    return Service.of({
      list: Effect.fn("SandboxGrants.list")(function* () {
        const store = yield* load()
        return Object.values(store.grants).flat()
      }),
      prefixes: Effect.fn("SandboxGrants.prefixes")(function* () {
        const store = yield* load()
        return Object.values(store.commandPrefixes ?? {}).flat()
      }),
      grant: Effect.fn("SandboxGrants.grant")(function* (input: GrantInput) {
        const store = yield* load()
        const { scope, scopeKind } = normScope(input.scope, input.scopeKind)
        const grant = new Grant({
          toolName: input.toolName,
          scope,
          scopeKind,
          decision: input.decision,
          approvedAt: new Date().toISOString(),
          reason: input.reason,
          session: input.session,
        })
        const list = (store.grants[input.toolName] ?? []).filter(
          (g) => !(g.scope === scope && g.scopeKind === scopeKind),
        )
        store.grants[input.toolName] = [...list, grant]
        yield* save(store)
      }),
      grantPrefix: Effect.fn("SandboxGrants.grantPrefix")(function* (input) {
        if (input.prefix.length === 0) return yield* Effect.die(new Error("empty command prefix"))
        const store = yield* load()
        const grant = new CommandPrefixGrant({
          toolName: input.toolName,
          prefix: [...input.prefix],
          decision: input.decision,
          approvedAt: new Date().toISOString(),
          session: input.session,
        })
        const key = input.toolName
        const list = (store.commandPrefixes?.[key] ?? []).filter(
          (g) => JSON.stringify(g.prefix) !== JSON.stringify(grant.prefix),
        )
        store.commandPrefixes = { ...(store.commandPrefixes ?? {}), [key]: [...list, grant] }
        yield* save(store)
      }),
      revoke: Effect.fn("SandboxGrants.revoke")(function* (toolName: string, scope?: string) {
        const store = yield* load()
        const before = (store.grants[toolName] ?? []).length
        store.grants[toolName] = (store.grants[toolName] ?? []).filter((g) =>
          scope === undefined ? false : g.scope !== scope,
        )
        if (scope === undefined) delete store.grants[toolName]
        const prefixes = store.commandPrefixes?.[toolName] ?? []
        if (scope !== undefined) {
          store.commandPrefixes = {
            ...(store.commandPrefixes ?? {}),
            [toolName]: prefixes.filter((g) => JSON.stringify(g.prefix) !== JSON.stringify(scope.split(" "))),
          }
        }
        yield* save(store)
        return (store.grants[toolName]?.length ?? 0) < before
      }),
      clear: Effect.fn("SandboxGrants.clear")(function* () {
        yield* save(emptyStore())
      }),
      lookup: Effect.fn("SandboxGrants.lookup")(function* (toolName: string, scope?: string) {
        const store = yield* load()
        const list = store.grants[toolName] ?? []
        if (scope) {
          const hit = list.find((g) => g.scope === scope)
          if (hit) return hit
        }
        return list.find((g) => !g.scope)
      }),
      lookupPrefix: Effect.fn("SandboxGrants.lookupPrefix")(function* (toolName: string, command: string[]) {
        const store = yield* load()
        return (store.commandPrefixes?.[toolName] ?? []).find((g) => hasStringPrefix(command, g.prefix))
      }),
    })
  }),
)

export const node = makeGlobalNode({ service: Service, layer, deps: [FSUtil.node] })
