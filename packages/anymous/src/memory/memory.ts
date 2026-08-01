import { LayerNode } from "@anymous-ai/core/effect/layer-node"
import { Effect, Layer, Context, Schema } from "effect"
import { FSUtil } from "@anymous-ai/core/fs-util"
import { Global } from "@anymous-ai/core/global"
import path from "path"

const MemoryEntry = Schema.Struct({
  key: Schema.String,
  value: Schema.String,
  timestamp: Schema.Number,
  sessionID: Schema.optional(Schema.String),
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
      const store = yield* loadStore(fs, filePath).pipe(Effect.orDie)
      const memories = [...store.memories]
      const existing = memories.findIndex((m) => m.key === key)
      const entry: MemoryEntryType = { key, value, timestamp: Date.now(), ...(sessionID ? { sessionID } : {}) }
      if (existing >= 0) {
        memories[existing] = entry
      } else {
        memories.push(entry)
      }
      yield* saveStore(fs, filePath, { ...store, memories }).pipe(Effect.orDie)
    })

    const list: Interface["list"] = Effect.fn("Memory.list")(function* () {
      const store = yield* loadStore(fs, filePath).pipe(Effect.orDie)
      return [...store.memories]
    })

    const remove: Interface["delete"] = Effect.fn("Memory.delete")(function* (key: string) {
      const store = yield* loadStore(fs, filePath).pipe(Effect.orDie)
      const memories = [...store.memories]
      const idx = memories.findIndex((m) => m.key === key)
      if (idx < 0) return false
      memories.splice(idx, 1)
      yield* saveStore(fs, filePath, { ...store, memories }).pipe(Effect.orDie)
      return true
    })

    const allText: Interface["allText"] = Effect.fn("Memory.allText")(function* () {
      const store = yield* loadStore(fs, filePath).pipe(Effect.orDie)
      if (store.memories.length === 0) return undefined
      const lines = store.memories.map((m) => `- ${m.key}: ${m.value}`)
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
