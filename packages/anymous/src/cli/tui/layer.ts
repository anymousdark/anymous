import { run as runTui, type TuiInput } from "@anymous-ai/tui"
import { Global } from "@anymous-ai/core/global"
import { AppNodeBuilder } from "@anymous-ai/core/effect/app-node-builder"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(AppNodeBuilder.build(Global.node)))
}
