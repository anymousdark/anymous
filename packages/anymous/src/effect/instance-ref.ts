import { Context } from "effect"
import type { InstanceContext } from "@/project/instance-context"
import type { WorkspaceV2 } from "@anymous-ai/core/workspace"

export const InstanceRef = Context.Reference<InstanceContext | undefined>("~anymous/InstanceRef", {
  defaultValue: () => undefined,
})

export const WorkspaceRef = Context.Reference<WorkspaceV2.ID | undefined>("~anymous/WorkspaceRef", {
  defaultValue: () => undefined,
})
