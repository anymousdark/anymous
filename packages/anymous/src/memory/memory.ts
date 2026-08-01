import { LayerNode } from "@anymous-ai/core/effect/layer-node"
import { Effect, Layer, Context, Schema } from "effect"
import { FSUtil } from "@anymous-ai/core/fs-util"
import { Global } from "@anymous-ai/core/global"
import { InstanceState } from "@/effect/instance-state"
import path from "path"

const MemoryEntry = Schema.Struct({
  key: Schema.String,
  value: Schema.String,
  timestamp: Schema.Number,
  sessionID: Schema.optional(Schema.String),
  scope: Schema.optional(Schema.String),
})

const MemoryStore = Schema.Struct({
  version: Schema.Literal(1),
  memories: Schema.Array(MemoryEntry),
})

interface MemoryEntryType extends Schema.Schema.Type<typeof MemoryEntry> {}
interface MemoryStoreType extends Schema.Schema.Type<typeof MemoryStore> {}

export interface Interface {
  readonly read: (key: string) => Effect.Effect<MemoryEntryType | undefined>
  readonly write: (key: string, value: string, sessionID?: string) => Effect.Effect<void>
  readonly list: () => Effect.Effect<MemoryEntryType[]>
  readonly delete: (key: string) => Effect.Effect<boolean>
  readonly allText: () => Effect.Effect<string | undefined>
}

export class Service extends Context.Service<Service, Interface>()("@anymous/Memory") {}

const memoryFilePath = (global: { config: string }) => path.join(global.config, "memory.json")

const loadStore = (fs: FSUtil.Interface, filePath: string) =>
  Effect.gen(function* () {
    const exists = yield* fs.exists(filePath)
    if (!exists) {
      return { version: 1, memories: [] } as MemoryStoreType
    }
    const raw = yield* fs.readFileString(filePath)
    const parsed = JSON.parse(raw) as unknown
    const decoded = yield* Effect.sync(() => Schema.decodeUnknownSync(MemoryStore)(parsed)).pipe(
      Effect.catch(() => Effect.succeed({ version: 1, memories: [] } as MemoryStoreType)),
    )
    return decoded
  })

const saveStore = (fs: FSUtil.Interface, filePath: string, store: MemoryStoreType) =>
  Effect.gen(function* () {
    yield* fs.writeFileString(filePath, JSON.stringify(store, null, 2))
  })

// Resolve the current workspace scope. Falls back to the process-wide default workspace
// when the effect is run outside a project instance (e.g. CLI/global context).
const currentScope = Effect.map(InstanceState.workspaceID, (id) => id ?? undefined)

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const fs = yield* FSUtil.Service
    const global = yield* Global.Service
    const filePath = memoryFilePath(global)

    const read: Interface["read"] = Effect.fn("Memory.read")(function* (key: string) {
      const store = yield* loadStore(fs, filePath).pipe(Effect.orDie)
      return store.memories.find((m) => m.key === key)
    })

    const write: Interface["write"] = Effect.fn("Memory.write")(function* (
      key: string,
      value: string,
      sessionID?: string,
    ) {
      const scope = yield* currentScope
      const store = yield* loadStore(fs, filePath).pipe(Effect.orDie)
      const memories = [...store.memories]
      const existing = memories.findIndex((m) => m.key === key && m.scope === scope)
      const entry: MemoryEntryType = {
        key,
        value,
        timestamp: Date.now(),
        ...(sessionID ? { sessionID } : {}),
        ...(scope ? { scope } : {}),
      }
      if (existing >= 0) {
        memories[existing] = entry
      } else {
        memories.push(entry)
      }
      yield* saveStore(fs, filePath, { ...store, memories }).pipe(Effect.orDie)
    })

    const list: Interface["list"] = Effect.fn("Memory.list")(function* () {
      const scope = yield* currentScope
      const store = yield* loadStore(fs, filePath).pipe(Effect.orDie)
      return store.memories.filter((m) => m.scope === scope)
    })

    const remove: Interface["delete"] = Effect.fn("Memory.delete")(function* (key: string) {
      const scope = yield* currentScope
      const store = yield* loadStore(fs, filePath).pipe(Effect.orDie)
      const memories = [...store.memories]
      const idx = memories.findIndex((m) => m.key === key && m.scope === scope)
      if (idx < 0) return false
      memories.splice(idx, 1)
      yield* saveStore(fs, filePath, { ...store, memories }).pipe(Effect.orDie)
      return true
    })

    const allText: Interface["allText"] = Effect.fn("Memory.allText")(function* () {
      const scope = yield* currentScope
      const store = yield* loadStore(fs, filePath).pipe(Effect.orDie)
      // Project-scoped memories are visible only within their own project; unscoped
      // entries remain global (shared context for every workspace).
      const entries = store.memories.filter((m) => m.scope === undefined || m.scope === scope)
      if (entries.length === 0) return undefined
      const lines = entries.map((m) => `- ${m.key}: ${m.value}`)
      return `## Shared Context / Memory\n\n${lines.join("\n")}`
    })

    return Service.of({ read, write, list, delete: remove, allText })
  }),
)

export const node = LayerNode.make({
  service: Service,
  layer: layer.pipe(Layer.orDie),
  deps: [FSUtil.node, Global.node],
})

export * as Memory from "./memory"
