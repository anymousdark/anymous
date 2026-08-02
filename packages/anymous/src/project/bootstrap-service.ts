import type { Effect } from "effect"
import { Context } from "effect"

export interface Interface {
  readonly run: Effect.Effect<void>
}

export class Service extends Context.Service<Service, Interface>()("@anymous/InstanceBootstrap") {}

export * as InstanceBootstrap from "./bootstrap-service"
