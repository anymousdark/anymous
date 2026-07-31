import { LayerNode } from "@anymous-ai/core/effect/layer-node"
import { Effect, Layer, Context, Schema, ParseResult } from "effect"
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
    const decoded = yield* Schema.decodeUnknown(MemoryStore)(parsed).pipe(
      Effect.catchAll(() => Effect.succeed({ version: 1, memories: [] } as MemoryStoreType)),
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
      const store = yield* loadStore(fs, filePath)
      return store.memories.find((m) => m.key === key)
    })

    const write: Interface["write"] = Effect.fn("Memory.write")(function* (key: string, value: string, sessionID?: string) {
      const store = yield* loadStore(fs, filePath)
      const existing = store.memories.findIndex((m) => m.key === key)
      const entry: MemoryEntryType = { key, value, timestamp: Date.now(), ...(sessionID ? { sessionID } : {}) }
      if (existing >= 0) {
        store.memories[existing] = entry
      } else {
        store.memories.push(entry)
      }
      yield* saveStore(fs, filePath, store)
    })

    const list: Interface["list"] = Effect.fn("Memory.list")(function* () {
      const store = yield* loadStore(fs, filePath)
      return store.memories
    })

    const remove: Interface["delete"] = Effect.fn("Memory.delete")(function* (key: string) {
      const store = yield* loadStore(fs, filePath)
      const idx = store.memories.findIndex((m) => m.key === key)
      if (idx < 0) return false
      store.memories.splice(idx, 1)
      yield* saveStore(fs, filePath, store)
      return true
    })

    const allText: Interface["allText"] = Effect.fn("Memory.allText")(function* () {
      const store = yield* loadStore(fs, filePath)
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
