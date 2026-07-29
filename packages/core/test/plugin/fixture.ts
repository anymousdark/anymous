import { AgentV2 } from "@anymous-ai/core/agent"
import { AISDK } from "@anymous-ai/core/aisdk"
import { Catalog } from "@anymous-ai/core/catalog"
import { CommandV2 } from "@anymous-ai/core/command"
import { Credential } from "@anymous-ai/core/credential"
import { AppNodeBuilder } from "@anymous-ai/core/effect/app-node-builder"
import { LayerNodePlatform } from "@anymous-ai/core/effect/app-node-platform"
import { LayerNode } from "@anymous-ai/core/effect/layer-node"
import { EventV2 } from "@anymous-ai/core/event"
import { FileSystem } from "@anymous-ai/core/filesystem"
import { FSUtil } from "@anymous-ai/core/fs-util"
import { Integration } from "@anymous-ai/core/integration"
import { Location } from "@anymous-ai/core/location"
import { Npm } from "@anymous-ai/core/npm"
import { PluginV2 } from "@anymous-ai/core/plugin"
import { Reference } from "@anymous-ai/core/reference"
import { SkillV2 } from "@anymous-ai/core/skill"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"

const npmLayer = Layer.succeed(
  Npm.Service,
  Npm.Service.of({
    add: () => Effect.succeed({ directory: "", entrypoint: undefined }),
    install: () => Effect.void,
    which: () => Effect.succeed(undefined),
  }),
)

export const PluginTestLayer = AppNodeBuilder.build(
  LayerNode.group([
    FileSystem.node,
    FSUtil.node,
    Location.node,
    Npm.node,
    Credential.node,
    EventV2.node,
    LayerNodePlatform.httpClient,
    PluginV2.node,
    AgentV2.node,
    AISDK.node,
    Catalog.node,
    CommandV2.node,
    Integration.node,
    Reference.node,
    SkillV2.node,
  ]),
  [
    [Location.node, tempLocationLayer],
    [Npm.node, npmLayer],
  ],
)
