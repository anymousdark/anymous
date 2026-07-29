export * from "./client.js"
export * from "./server.js"

import { createanymousClient } from "./client.js"
import { createanymousServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export * as data from "./data.js"

export async function createanymous(options?: ServerOptions) {
  const server = await createanymousServer({
    ...options,
  })

  const client = createanymousClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
