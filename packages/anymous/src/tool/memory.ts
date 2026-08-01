import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import { Memory } from "@/memory/memory"
import DESCRIPTION from "./memory.txt"

export const Parameters = Schema.Struct({
  action: Schema.Literals(["read", "write", "delete", "list"]).annotate({ description: "Action to perform" }),
  key: Schema.optional(Schema.String).annotate({ description: "Memory key (required for read/write/delete)" }),
  value: Schema.optional(Schema.String).annotate({ description: "Memory value (required for write)" }),
})

export const MemoryTool = Tool.define<typeof Parameters, {}, Memory.Service>(
  "memory",
  Effect.gen(function* () {
    const memory = yield* Memory.Service

    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>) =>
        Effect.gen(function* () {
          const { action, key, value } = params

          if (action === "list") {
            const entries = yield* memory.list()
            if (entries.length === 0) {
              return { title: "No memories", output: "No memories stored.", metadata: {} }
            }
            const formatted = entries.map((e) => `- ${e.key}: ${e.value}`).join("\n")
            return { title: `Listed ${entries.length} memories`, output: formatted, metadata: {} }
          }

          if (action === "read") {
            if (!key) return { title: "Error", output: "Key is required for read action.", metadata: {} }
            const entry = yield* memory.read(key)
            if (!entry) return { title: "Not found", output: `No memory found for key "${key}".`, metadata: {} }
            return { title: `Read memory: ${key}`, output: entry.value, metadata: {} }
          }

          if (action === "write") {
            if (!key || !value) {
              return { title: "Error", output: "Both key and value are required for write action.", metadata: {} }
            }
            yield* memory.write(key, value)
            return { title: `Memory saved: ${key}`, output: `Saved memory "${key}".`, metadata: {} }
          }

          if (action === "delete") {
            if (!key) return { title: "Error", output: "Key is required for delete action.", metadata: {} }
            const deleted = yield* memory.delete(key)
            if (!deleted) return { title: "Not found", output: `No memory found for key "${key}".`, metadata: {} }
            return { title: `Memory deleted: ${key}`, output: `Deleted memory "${key}".`, metadata: {} }
          }

          return { title: "Unknown action", output: `Unknown action: ${action}`, metadata: {} }
        }).pipe(Effect.orDie),
    }
  }),
)
