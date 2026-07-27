import { Config } from "@/config/config"
import { AppRuntime } from "@/effect/app-runtime"
import { Flag } from "@anymous-ai/core/flag/flag"
import { Installation } from "@/installation"
import { InstallationVersion } from "@anymous-ai/core/installation/version"
import { GlobalBus } from "@/bus/global"

const ANYMOUS_RELEASES = "https://api.github.com/repos/anymousdark/anymous/releases/latest"

async function checkanymousUpdate(): Promise<string | null> {
  try {
    const resp = await fetch(ANYMOUS_RELEASES, { headers: { "User-Agent": "anymous" } })
    if (!resp.ok) return null
    const data: any = await resp.json()
    return (data.tag_name as string).replace(/^v/, "")
  } catch {
    return null
  }
}

export async function upgrade() {
  const config = await AppRuntime.runPromise(Config.Service.use((cfg) => cfg.getGlobal()))
  if (config.autoupdate === false || Flag.ANYMOUS_DISABLE_AUTOUPDATE) return

  // Check if anymous has a newer release (sync needed)
  const anymousLatest = await checkanymousUpdate()
  if (anymousLatest && anymousLatest !== InstallationVersion) {
    GlobalBus.emit("event", {
      directory: "global",
      payload: {
        type: Installation.Event.UpdateAvailable.type,
        properties: { version: `anymous v${anymousLatest} — run 'bun run script/sync-anymous.ts' to sync` },
      },
    })
  }

  const method = await Installation.method()
  const latest = await Installation.latest(method).catch(() => {})
  if (!latest) return

  if (Flag.ANYMOUS_ALWAYS_NOTIFY_UPDATE) {
    GlobalBus.emit("event", {
      directory: "global",
      payload: {
        type: Installation.Event.UpdateAvailable.type,
        properties: { version: latest },
      },
    })
    return
  }

  if (InstallationVersion === latest) return

  const kind = Installation.getReleaseType(InstallationVersion, latest)

  if (config.autoupdate === "notify" || kind !== "patch") {
    GlobalBus.emit("event", {
      directory: "global",
      payload: {
        type: Installation.Event.UpdateAvailable.type,
        properties: { version: latest },
      },
    })
    return
  }

  if (method === "unknown") return
  await Installation.upgrade(method, latest)
    .then(() =>
      GlobalBus.emit("event", {
        directory: "global",
        payload: {
          type: Installation.Event.Updated.type,
          properties: { version: latest },
        },
      }),
    )
    .catch(() => {})
}
