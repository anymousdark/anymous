import { LayerNode } from "@anymous-ai/core/effect/layer-node"
import { httpClient, path } from "@anymous-ai/core/effect/app-node-platform"
import { NodePath } from "@effect/platform-node"
import { Effect, Layer, Path, Schema, Context, Duration, Option } from "effect"
import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http"
import { withTransientReadRetry } from "@/util/effect-http-client"
import { FSUtil } from "@anymous-ai/core/fs-util"
import { Global } from "@anymous-ai/core/global"

const skillConcurrency = 4
const fileConcurrency = 8

class IndexSkill extends Schema.Class<IndexSkill>("IndexSkill")({
  name: Schema.String,
  files: Schema.Array(Schema.String),
  version: Schema.optional(Schema.String),
}) {}

class Index extends Schema.Class<Index>("Index")({
  skills: Schema.Array(IndexSkill),
}) {}

export interface Interface {
  readonly pull: (url: string) => Effect.Effect<string[]>
}

export class Service extends Context.Service<Service, Interface>()("@anymous/SkillDiscovery") {}

const layer: Layer.Layer<Service, never, FSUtil.Service | Path.Path | HttpClient.HttpClient> = Layer.effect(
  Service,
  Effect.gen(function* () {
    const fs = yield* FSUtil.Service
    const path = yield* Path.Path
    const http = HttpClient.filterStatusOk(withTransientReadRetry(yield* HttpClient.HttpClient))
    // Raw client (no status filter): downloads inspect res.status directly
    // so 404s can be remembered instead of throwing.
    const client = yield* HttpClient.HttpClient
    const cache = path.join(Global.Path.cache, "skills")

    // Files that 404 upstream would otherwise be re-requested on every
    // startup (a failed download leaves nothing on disk to skip next time).
    // Remember them with a marker file and revalidate weekly.
    const MISSING_TTL = Duration.days(7)
    const missingMarker = (dest: string) => `${dest}.anymous-missing`

    const download = Effect.fn("Discovery.download")(function* (url: string, dest: string) {
      if (yield* fs.exists(dest).pipe(Effect.orDie)) return true

      const marker = missingMarker(dest)
      if (yield* fs.exists(marker).pipe(Effect.orDie)) {
        const stat = yield* fs.stat(marker).pipe(Effect.catch(() => Effect.succeed(undefined)))
        const mtime = stat ? Option.getOrElse(stat.mtime, () => new Date(0)).getTime() : 0
        if (Date.now() - mtime < Duration.toMillis(MISSING_TTL)) return false
        yield* fs.remove(marker, { force: true }).pipe(Effect.ignore)
      }

      const res = yield* HttpClientRequest.get(url).pipe(
        client.execute,
        Effect.catch((err) => Effect.logError("failed to download", { url: url, error: err }).pipe(Effect.as(null))),
      )
      if (!res) return false
      if (res.status === 404) {
        yield* Effect.logDebug("skill file missing upstream, remembering", { url: url })
        yield* fs.writeWithDirs(marker, String(Date.now())).pipe(Effect.ignore)
        return false
      }
      if (res.status < 200 || res.status >= 300) {
        yield* Effect.logError("failed to download", { url: url, error: `HTTP ${res.status}` })
        return false
      }
      const body = yield* res.arrayBuffer.pipe(
        Effect.catch((err) => Effect.logError("failed to download", { url: url, error: err }).pipe(Effect.as(null))),
      )
      if (!body) return false
      const wrote = yield* fs.writeWithDirs(dest, new Uint8Array(body)).pipe(
        Effect.as(true),
        Effect.catch((err) => Effect.logError("failed to download", { url: url, error: err }).pipe(Effect.as(false))),
      )
      if (wrote) yield* fs.remove(marker, { force: true }).pipe(Effect.ignore)
      return wrote
    })

    const pull = Effect.fn("Discovery.pull")(function* (url: string) {
      const base = url.endsWith("/") ? url : `${url}/`
      const index = new URL("index.json", base).href
      const host = base.slice(0, -1)

      yield* Effect.logInfo("fetching index", { url: index })

      const data = yield* HttpClientRequest.get(index).pipe(
        HttpClientRequest.acceptJson,
        http.execute,
        Effect.flatMap(HttpClientResponse.schemaBodyJson(Index)),
        Effect.catch((err) =>
          Effect.logError("failed to fetch index", { url: index, error: err }).pipe(Effect.as(null)),
        ),
      )

      if (!data) return []

      const missing = data.skills.filter((skill) => !skill.files.includes("SKILL.md"))
      yield* Effect.forEach(
        missing,
        (skill) => Effect.logWarning("skill entry missing SKILL.md", { url: index, skill: skill.name }),
        { discard: true },
      )
      const list = data.skills.filter((skill) => skill.files.includes("SKILL.md"))

      const dirs = yield* Effect.forEach(
        list,
        (skill) =>
          Effect.gen(function* () {
            const root = path.join(cache, skill.name)
            const versionFile = path.join(root, ".anymous-version")
            const version = skill.version
            const current =
              version === undefined
                ? undefined
                : yield* fs.readFileStringSafe(versionFile).pipe(Effect.catch(() => Effect.succeed(undefined)))

            if (version === undefined || current === version) {
              yield* Effect.forEach(
                skill.files,
                (file) => download(new URL(file, `${host}/${skill.name}/`).href, path.join(root, file)),
                { concurrency: fileConcurrency, discard: true },
              )
            } else {
              const token = crypto.randomUUID()
              const staging = `${root}.tmp-${token}`
              const backup = `${root}.old-${token}`
              yield* Effect.gen(function* () {
                const downloaded = yield* Effect.forEach(
                  skill.files,
                  (file) => download(new URL(file, `${host}/${skill.name}/`).href, path.join(staging, file)),
                  { concurrency: fileConcurrency },
                )
                if (!downloaded.every(Boolean)) return
                if (!(yield* fs.exists(path.join(staging, "SKILL.md")).pipe(Effect.orDie))) return
                yield* fs.writeFileString(path.join(staging, ".anymous-version"), version)
                yield* Effect.uninterruptible(
                  Effect.gen(function* () {
                    const cached = yield* fs.exists(root).pipe(Effect.orDie)
                    if (cached) yield* fs.rename(root, backup)
                    yield* fs.rename(staging, root).pipe(
                      Effect.catch((error) =>
                        Effect.gen(function* () {
                          if (cached) yield* fs.rename(backup, root).pipe(Effect.ignore)
                          return yield* Effect.fail(error)
                        }),
                      ),
                    )
                    if (cached) yield* fs.remove(backup, { recursive: true, force: true }).pipe(Effect.ignore)
                  }),
                )
              }).pipe(
                Effect.catch((error) => Effect.logError("failed to refresh skill", { skill: skill.name, error })),
                Effect.ensuring(fs.remove(staging, { recursive: true, force: true }).pipe(Effect.ignore)),
              )
            }
            return (yield* fs.exists(path.join(root, "SKILL.md")).pipe(Effect.orDie)) ? root : null
          }),
        { concurrency: skillConcurrency },
      )

      return dirs.filter((dir): dir is string => dir !== null)
    })

    return Service.of({ pull })
  }),
)

export const node = LayerNode.make({ service: Service, layer: layer, deps: [FSUtil.node, path, httpClient] })

export * as Discovery from "./discovery"
