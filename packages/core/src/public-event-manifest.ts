export * as PublicEventManifest from "./public-event-manifest"

import { Event } from "@anymous-ai/schema/event"
import { EventManifest } from "@anymous-ai/schema/event-manifest"

export const Definitions = EventManifest.ServerDefinitions
export const Latest = Event.latest(Definitions)
