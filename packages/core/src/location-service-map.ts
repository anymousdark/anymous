import type { LayerMap } from "effect"
import { Context, Effect, Layer } from "effect"
import { LayerNode } from "./effect/layer-node"
import { Node } from "./effect/app-node"
import type { Location } from "./location"
import type { LocationError, LocationServices } from "./location-services"

export class Service extends Context.Service<
  Service,
  LayerMap.LayerMap<Location.Ref, LocationServices, LocationError>
>()("@anymous/example/LocationServiceMap") {
  static get(ref: Location.Ref) {
    return Layer.unwrap(Effect.map(Service, (locations) => locations.get(ref)))
  }
}

export const node = LayerNode.unbound(Service, Node.tags.values.global)

export * as LocationServiceMap from "./location-service-map"
