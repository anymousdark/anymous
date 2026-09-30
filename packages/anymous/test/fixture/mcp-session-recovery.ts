import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport, StreamableHTTPError } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js"

const posts: Array<{ method: string; session: string | null }> = []
let initializeCount = 0
let pingCount = 0
const server = Bun.serve({
  port: 0,
  async fetch(request) {
    if (request.method === "GET") return new Response(null, { status: 405 })
    if (request.method === "DELETE") return new Response(null, { status: 200 })

    const message = (await request.json()) as { id?: number; method: string }
    const session = request.headers.get("mcp-session-id")
    posts.push({ method: message.method, session })

    if (message.method === "initialize") {
      initializeCount++
      return Response.json(
        {
          jsonrpc: "2.0",
          id: message.id,
          result: {
            protocolVersion: LATEST_PROTOCOL_VERSION,
            capabilities: {},
            serverInfo: { name: "test", version: "1" },
          },
        },
        { headers: { "mcp-session-id": initializeCount === 1 ? "expired" : "replacement" } },
      )
    }

    if (message.method === "notifications/initialized") return new Response(null, { status: 202 })

    pingCount++
    if (pingCount === 1) return new Response("Session not found", { status: 404 })
    return Response.json({ jsonrpc: "2.0", id: message.id, result: {} })
  },
})

const url = new URL(server.url)
const connect = async () => {
  const client = new Client({ name: "test", version: "1" })
  await client.connect(new StreamableHTTPClientTransport(url))
  return client
}

// NOTE: the pinned SDK no longer re-initializes automatically when a
// session-bound request returns 404, so recovery is explicit: drop the dead
// session, connect a fresh one, and retry the failed call once.
let client = await connect()
try {
  try {
    await client.ping()
  } catch (error) {
    if (!(error instanceof StreamableHTTPError) || error.code !== 404) throw error
    await client.close().catch(() => {})
    client = await connect()
    await client.ping()
  }
  process.stdout.write(JSON.stringify(posts))
} finally {
  await client.close()
  server.stop(true)
}
