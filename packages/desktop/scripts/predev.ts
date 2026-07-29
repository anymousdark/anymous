import { $ } from "bun"

await $`bun ./scripts/copy-icons.ts ${process.env.ANYMOUS_CHANNEL ?? "dev"}`

await $`cd ../anymous && bun script/build-node.ts`
