import type { Context } from "effect"
import { Config, ConfigProvider, Effect, Layer, Option } from "effect"
import { ConfigService } from "@/effect/config-service"

const bool = (name: string) => Config.boolean(name).pipe(Config.withDefault(false))
const positiveInteger = (name: string) =>
  Config.number(name).pipe(
    Config.map((value) => (Number.isInteger(value) && value > 0 ? value : undefined)),
    Config.orElse(() => Config.succeed(undefined)),
  )
const experimental = bool("ANYMOUS_EXPERIMENTAL")
const enabledByExperimental = (name: string) =>
  Config.all({ experimental, enabled: Config.boolean(name).pipe(Config.option) }).pipe(
    Config.map((flags) => Option.getOrElse(flags.enabled, () => flags.experimental)),
  )

export class Service extends ConfigService.Service<Service>()("@anymous/RuntimeFlags", {
  autoShare: bool("ANYMOUS_AUTO_SHARE"),
  pure: bool("ANYMOUS_PURE"),
  disableDefaultPlugins: bool("ANYMOUS_DISABLE_DEFAULT_PLUGINS"),
  fastBoot: bool("ANYMOUS_FAST_BOOT"),
  disableEmbeddedWebUi: bool("ANYMOUS_DISABLE_EMBEDDED_WEB_UI"),
  disableExternalSkills: bool("ANYMOUS_DISABLE_EXTERNAL_SKILLS"),
  disableLspDownload: bool("ANYMOUS_DISABLE_LSP_DOWNLOAD"),
  disableClaudeCodePrompt: Config.all({
    broad: bool("ANYMOUS_DISABLE_CLAUDE_CODE"),
    direct: bool("ANYMOUS_DISABLE_CLAUDE_CODE_PROMPT"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  disableClaudeCodeSkills: Config.all({
    broad: bool("ANYMOUS_DISABLE_CLAUDE_CODE"),
    direct: bool("ANYMOUS_DISABLE_CLAUDE_CODE_SKILLS"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  enableExa: Config.all({
    experimental,
    enabled: bool("ANYMOUS_ENABLE_EXA"),
    legacy: bool("ANYMOUS_EXPERIMENTAL_EXA"),
  }).pipe(Config.map((flags) => flags.experimental || flags.enabled || flags.legacy)),
  enableParallel: Config.all({
    enabled: bool("ANYMOUS_ENABLE_PARALLEL"),
    legacy: bool("ANYMOUS_EXPERIMENTAL_PARALLEL"),
  }).pipe(Config.map((flags) => flags.enabled || flags.legacy)),
  enableExperimentalModels: bool("ANYMOUS_ENABLE_EXPERIMENTAL_MODELS"),
  enableQuestionTool: bool("ANYMOUS_ENABLE_QUESTION_TOOL"),
  experimentalReferences: enabledByExperimental("ANYMOUS_EXPERIMENTAL_REFERENCES"),
  experimentalBackgroundSubagents: enabledByExperimental("ANYMOUS_EXPERIMENTAL_BACKGROUND_SUBAGENTS"),
  experimentalLspTy: bool("ANYMOUS_EXPERIMENTAL_LSP_TY"),
  experimentalLspTool: enabledByExperimental("ANYMOUS_EXPERIMENTAL_LSP_TOOL"),
  experimentalOxfmt: enabledByExperimental("ANYMOUS_EXPERIMENTAL_OXFMT"),
  experimentalPlanMode: enabledByExperimental("ANYMOUS_EXPERIMENTAL_PLAN_MODE"),
  experimentalCodeMode: enabledByExperimental("ANYMOUS_EXPERIMENTAL_CODE_MODE"),
  experimentalEventSystem: enabledByExperimental("ANYMOUS_EXPERIMENTAL_EVENT_SYSTEM"),
  experimentalWorkspaces: enabledByExperimental("ANYMOUS_EXPERIMENTAL_WORKSPACES"),
  experimentalIconDiscovery: enabledByExperimental("ANYMOUS_EXPERIMENTAL_ICON_DISCOVERY"),
  outputTokenMax: positiveInteger("ANYMOUS_EXPERIMENTAL_OUTPUT_TOKEN_MAX"),
  bashDefaultTimeoutMs: positiveInteger("ANYMOUS_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS"),
  experimentalNativeLlm: bool("ANYMOUS_EXPERIMENTAL_NATIVE_LLM"),
  experimentalWebSockets: bool("ANYMOUS_EXPERIMENTAL_WEBSOCKETS"),
  client: Config.string("ANYMOUS_CLIENT").pipe(Config.withDefault("cli")),
}) {}

export type Info = Context.Service.Shape<typeof Service>

const emptyConfigLayer = Service.layer.pipe(
  Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({}))),
  Layer.orDie,
)

export const layer = (overrides: Partial<Info> = {}) =>
  Layer.effect(
    Service,
    Effect.gen(function* () {
      const flags = yield* Service
      return Service.of({ ...flags, ...overrides })
    }),
  ).pipe(Layer.provide(emptyConfigLayer))

export const node = LayerNode.make({ service: Service, layer: Service.layer.pipe(Layer.orDie), deps: [] })

export * as RuntimeFlags from "./runtime-flags"
import { LayerNode } from "@anymous-ai/core/effect/layer-node"
