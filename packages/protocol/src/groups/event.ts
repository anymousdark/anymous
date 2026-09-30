import { Event } from "@anymous-ai/schema/event"
import { EventManifest } from "@anymous-ai/schema/event-manifest"
import { Location } from "@anymous-ai/schema/location"
import type { Definition } from "@anymous-ai/schema/event"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"

const fields = {
  id: Event.ID,
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  durable: Schema.optional(Schema.Struct({ aggregateID: Schema.String, seq: Schema.Int, version: Schema.Int })),
  location: Schema.optional(Location.Ref),
}

const schema = <const Definitions extends ReadonlyArray<Definition>>(definitions: Definitions) =>
  Schema.Union([
    ...definitions,
    ...(definitions.some((definition) => definition.type === "server.connected")
      ? []
      : [
          Schema.Struct({
            ...fields,
            type: Schema.Literal("server.connected"),
            data: Schema.Struct({}),
          }).annotate({ identifier: "V2Event.server.connected" }),
        ]),
  ]).annotate({ identifier: "V2Event" })

const make = <const Definitions extends ReadonlyArray<Definition>>(definitions: Definitions) => {
  const EventSchema = schema(definitions)
  // NOTE: `Schema.fromJsonString` propagates the inner identifier onto the
  // string wrapper, so `StreamSse({ data: EventSchema })` makes the wrapper
  // and the union both claim "V2Event" and the union gets suffixed to
  // "V2Event1". Build the SSE envelope explicitly with the wrapper renamed
  // to "V2EventStream" so the union keeps "V2Event".
  // The runtime handler is `handleRaw`, so this schema is documentary only.
  const EventStreamData = Schema.fromJsonString(EventSchema).annotate({ identifier: "V2EventStream" })
  const EventStreamEvents = Schema.Struct({
    id: Schema.UndefinedOr(Schema.String),
    event: Schema.String,
    data: EventStreamData,
  })
  return {
    schema: EventSchema,
    group: HttpApiGroup.make("server.event")
      .add(
        HttpApiEndpoint.get("event.subscribe", "/api/event", {
          success: HttpApiSchema.StreamSse({ events: EventStreamEvents }),
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "v2.event.subscribe",
            summary: "Subscribe to events",
            description: "Subscribe to native event payloads for the server.",
          }),
        ),
      )
      .annotateMerge(OpenApi.annotations({ title: "events", description: "Experimental event stream route." })),
  }
}

export const makeEventGroup = <const Definitions extends ReadonlyArray<Definition>>(definitions: Definitions) =>
  make(definitions).group

const event = make(EventManifest.ServerDefinitions)
export const EventGroup = event.group
export const anymousEvent = event.schema
export type anymousEvent = typeof anymousEvent.Type
export type anymousEventEncoded = typeof anymousEvent.Encoded
