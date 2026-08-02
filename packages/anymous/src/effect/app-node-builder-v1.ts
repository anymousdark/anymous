import { AppNodeBuilder } from "@anymous-ai/core/effect/app-node-builder"
import type { LayerNode } from "@anymous-ai/core/effect/layer-node"
import { InstanceBootstrap } from "@/project/bootstrap"
import { InstanceStore } from "@/project/instance-store"

const bootstrapReplacement = [InstanceStore.bootstrapNode, InstanceBootstrap.node] as const

export function build<A, E>(root: LayerNode.Node<A, E, any>, replacements: LayerNode.Replacements = []) {
  return AppNodeBuilder.build(root, replacements.concat([bootstrapReplacement]))
}

export * as AppNodeBuilderV1 from "./app-node-builder-v1"
