import { Config } from "effect"

export function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

const copy = process.env["ANYMOUS_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
const fff = process.env["ANYMOUS_DISABLE_FFF"]

function enabledByExperimental(key: string) {
  return process.env[key] === undefined ? truthy("ANYMOUS_EXPERIMENTAL") : truthy(key)
}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  ANYMOUS_AUTO_HEAP_SNAPSHOT: truthy("ANYMOUS_AUTO_HEAP_SNAPSHOT"),
  ANYMOUS_GIT_BASH_PATH: process.env["ANYMOUS_GIT_BASH_PATH"],
  ANYMOUS_CONFIG: process.env["ANYMOUS_CONFIG"],
  ANYMOUS_CONFIG_CONTENT: process.env["ANYMOUS_CONFIG_CONTENT"],
  ANYMOUS_DISABLE_AUTOUPDATE: truthy("ANYMOUS_DISABLE_AUTOUPDATE"),
  ANYMOUS_ALWAYS_NOTIFY_UPDATE: truthy("ANYMOUS_ALWAYS_NOTIFY_UPDATE"),
  ANYMOUS_DISABLE_PRUNE: truthy("ANYMOUS_DISABLE_PRUNE"),
  ANYMOUS_DISABLE_TERMINAL_TITLE: truthy("ANYMOUS_DISABLE_TERMINAL_TITLE"),
  ANYMOUS_SHOW_TTFD: truthy("ANYMOUS_SHOW_TTFD"),
  ANYMOUS_DISABLE_AUTOCOMPACT: truthy("ANYMOUS_DISABLE_AUTOCOMPACT"),
  ANYMOUS_DISABLE_MODELS_FETCH: truthy("ANYMOUS_DISABLE_MODELS_FETCH"),
  ANYMOUS_DISABLE_MOUSE: truthy("ANYMOUS_DISABLE_MOUSE"),
  ANYMOUS_FAKE_VCS: process.env["ANYMOUS_FAKE_VCS"],
  ANYMOUS_SERVER_PASSWORD: process.env["ANYMOUS_SERVER_PASSWORD"],
  ANYMOUS_SERVER_USERNAME: process.env["ANYMOUS_SERVER_USERNAME"],
  ANYMOUS_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("ANYMOUS_DISABLE_FFF"),

  // Experimental
  ANYMOUS_EXPERIMENTAL_FILEWATCHER: Config.boolean("ANYMOUS_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  ANYMOUS_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("ANYMOUS_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  ANYMOUS_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("ANYMOUS_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  ANYMOUS_MODELS_URL: process.env["ANYMOUS_MODELS_URL"],
  ANYMOUS_MODELS_PATH: process.env["ANYMOUS_MODELS_PATH"],
  ANYMOUS_DB: process.env["ANYMOUS_DB"],

  ANYMOUS_WORKSPACE_ID: process.env["ANYMOUS_WORKSPACE_ID"],
  ANYMOUS_EXPERIMENTAL_WORKSPACES: enabledByExperimental("ANYMOUS_EXPERIMENTAL_WORKSPACES"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get ANYMOUS_DISABLE_PROJECT_CONFIG() {
    return truthy("ANYMOUS_DISABLE_PROJECT_CONFIG")
  },
  get ANYMOUS_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("ANYMOUS_EXPERIMENTAL_REFERENCES")
  },
  get ANYMOUS_TUI_CONFIG() {
    return process.env["ANYMOUS_TUI_CONFIG"]
  },
  get ANYMOUS_CONFIG_DIR() {
    return process.env["ANYMOUS_CONFIG_DIR"]
  },
  get ANYMOUS_PURE() {
    return truthy("ANYMOUS_PURE")
  },
  get ANYMOUS_PERMISSION() {
    return process.env["ANYMOUS_PERMISSION"]
  },
  get ANYMOUS_PLUGIN_META_FILE() {
    return process.env["ANYMOUS_PLUGIN_META_FILE"]
  },
  get ANYMOUS_CLIENT() {
    return process.env["ANYMOUS_CLIENT"] ?? "cli"
  },
}
