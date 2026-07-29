import { expect, test } from "bun:test"
import { Schema } from "effect"
import { AgentV2 } from "@anymous-ai/core/agent"
import { ModelV2 } from "@anymous-ai/core/model"
import { SessionV2 } from "@anymous-ai/core/session"
import { Agent } from "@anymous-ai/schema/agent"
import { Location } from "@anymous-ai/schema/location"
import { Model } from "@anymous-ai/schema/model"
import { AgentAttachment, FileAttachment, Prompt, Source } from "@anymous-ai/schema/prompt"
import { Provider } from "@anymous-ai/schema/provider"
import { Project } from "@anymous-ai/schema/project"
import { ProjectDirectories } from "@anymous-ai/schema/project-directories"
import { PermissionV1 } from "@anymous-ai/schema/permission-v1"
import { Session } from "@anymous-ai/schema/session"
import { SessionInput } from "@anymous-ai/schema/session-input"
import { SessionMessage } from "@anymous-ai/schema/session-message"
import { Workspace } from "@anymous-ai/schema/workspace"
import { Command } from "@anymous-ai/schema/command"
import { Connection } from "@anymous-ai/schema/connection"
import { Credential } from "@anymous-ai/schema/credential"
import { FileSystem } from "@anymous-ai/schema/filesystem"
import { Integration } from "@anymous-ai/schema/integration"
import { LLM } from "@anymous-ai/schema/llm"
import { Permission } from "@anymous-ai/schema/permission"
import { Plugin } from "@anymous-ai/schema/plugin"
import { Pty } from "@anymous-ai/schema/pty"
import { Reference } from "@anymous-ai/schema/reference"
import { SessionTodo } from "@anymous-ai/schema/session-todo"
import { Skill } from "@anymous-ai/schema/skill"
import { AbsolutePath, DateTimeUtcFromMillis, optional, statics } from "@anymous-ai/schema/schema"
import { ProviderV2 } from "@anymous-ai/core/provider"
import { PluginV2 } from "@anymous-ai/core/plugin"

test("Core reuses the canonical shared schemas", async () => {
  const [
    coreCommand,
    coreConnection,
    coreCredential,
    coreFileSystem,
    coreIntegration,
    coreLocation,
    coreLLM,
    corePermission,
    corePermissionV1,
    coreProjectCopy,
    corePty,
    coreProject,
    coreReference,
    coreSessionInput,
    coreSessionMessage,
    coreSessionTodo,
    corePrompt,
    coreSkill,
    coreV2Schema,
    coreSchema,
    coreWorkspace,
  ] = await Promise.all([
    import("@anymous-ai/core/command"),
    import("@anymous-ai/core/integration/connection"),
    import("@anymous-ai/core/credential"),
    import("@anymous-ai/core/filesystem"),
    import("@anymous-ai/core/integration"),
    import("@anymous-ai/core/location"),
    import("@anymous-ai/llm"),
    import("@anymous-ai/core/permission"),
    import("@anymous-ai/core/v1/permission"),
    import("@anymous-ai/core/project/copy"),
    import("@anymous-ai/core/pty"),
    import("@anymous-ai/core/project/schema"),
    import("@anymous-ai/core/reference"),
    import("@anymous-ai/core/session/input"),
    import("@anymous-ai/core/session/message"),
    import("@anymous-ai/core/session/todo"),
    import("@anymous-ai/core/session/prompt"),
    import("@anymous-ai/core/skill"),
    import("@anymous-ai/core/v2-schema"),
    import("@anymous-ai/core/schema"),
    import("@anymous-ai/core/workspace"),
  ])

  const schemas = [
    [AgentV2.ID, Agent.ID],
    [AgentV2.Color, Agent.Color],
    [AgentV2.Info, Agent.Info],
    [coreCommand.Info, Command.Info],
    [coreConnection.CredentialInfo, Connection.CredentialInfo],
    [coreConnection.EnvInfo, Connection.EnvInfo],
    [coreConnection.Info, Connection.Info],
    [coreCredential.ID, Credential.ID],
    [coreCredential.OAuth, Credential.OAuth],
    [coreCredential.Key, Credential.Key],
    [coreCredential.Value, Credential.Value],
    [coreFileSystem.Entry, FileSystem.Entry],
    [coreFileSystem.Submatch, FileSystem.Submatch],
    [coreFileSystem.Match, FileSystem.Match],
    [coreIntegration.ID, Integration.ID],
    [coreIntegration.MethodID, Integration.MethodID],
    [coreIntegration.When, Integration.When],
    [coreIntegration.TextPrompt, Integration.TextPrompt],
    [coreIntegration.SelectPrompt, Integration.SelectPrompt],
    [coreIntegration.Prompt, Integration.Prompt],
    [coreIntegration.OAuthMethod, Integration.OAuthMethod],
    [coreIntegration.KeyMethod, Integration.KeyMethod],
    [coreIntegration.EnvMethod, Integration.EnvMethod],
    [coreIntegration.Method, Integration.Method],
    [coreIntegration.Inputs, Integration.Inputs],
    [coreIntegration.Ref, Integration.Ref],
    [coreLocation.Ref, Location.Ref],
    [coreLLM.ProviderMetadata, LLM.ProviderMetadata],
    [coreLLM.ToolTextContent, LLM.ToolTextContent],
    [coreLLM.ToolFileContent, LLM.ToolFileContent],
    [coreLLM.ToolContent, LLM.ToolContent],
    [ModelV2.ID, Model.ID],
    [ModelV2.VariantID, Model.VariantID],
    [ModelV2.Ref, Model.Ref],
    [ModelV2.Family, Model.Family],
    [ModelV2.Capabilities, Model.Capabilities],
    [ModelV2.Cost, Model.Cost],
    [ModelV2.Api, Model.Api],
    [ModelV2.Info, Model.Info],
    [ProviderV2.ID, Provider.ID],
    [ProviderV2.AISDK, Provider.AISDK],
    [ProviderV2.Native, Provider.Native],
    [ProviderV2.Api, Provider.Api],
    [ProviderV2.Request, Provider.Request],
    [ProviderV2.Info, Provider.Info],
    [corePermission.Effect, Permission.Effect],
    [corePermission.Rule, Permission.Rule],
    [corePermission.Ruleset, Permission.Ruleset],
    [corePermissionV1.Event, PermissionV1.Event],
    [coreProjectCopy.Event, ProjectDirectories.Event],
    [PluginV2.ID, Plugin.ID],
    [PluginV2.Event, Plugin.Event],
    [corePty.Info, Pty.Info],
    [corePty.Event, Pty.Event],
    [coreProject.ID, Project.ID],
    [coreReference.LocalSource, Reference.LocalSource],
    [coreReference.GitSource, Reference.GitSource],
    [coreReference.Source, Reference.Source],
    [SessionV2.ID, Session.ID],
    [SessionV2.Info, Session.Info],
    [SessionV2.ListAnchor, Session.ListAnchor],
    [coreSessionInput.Delivery, SessionInput.Delivery],
    [coreSessionInput.Admitted, SessionInput.Admitted],
    [coreSessionMessage.ID, SessionMessage.ID],
    [coreSessionMessage.UnknownError, SessionMessage.UnknownError],
    [coreSessionMessage.AgentSwitched, SessionMessage.AgentSwitched],
    [coreSessionMessage.ModelSwitched, SessionMessage.ModelSwitched],
    [coreSessionMessage.User, SessionMessage.User],
    [coreSessionMessage.Synthetic, SessionMessage.Synthetic],
    [coreSessionMessage.System, SessionMessage.System],
    [coreSessionMessage.Shell, SessionMessage.Shell],
    [coreSessionMessage.ToolStatePending, SessionMessage.ToolStatePending],
    [coreSessionMessage.ToolStateRunning, SessionMessage.ToolStateRunning],
    [coreSessionMessage.ToolStateCompleted, SessionMessage.ToolStateCompleted],
    [coreSessionMessage.ToolStateError, SessionMessage.ToolStateError],
    [coreSessionMessage.ToolState, SessionMessage.ToolState],
    [coreSessionMessage.AssistantTool, SessionMessage.AssistantTool],
    [coreSessionMessage.AssistantText, SessionMessage.AssistantText],
    [coreSessionMessage.AssistantReasoning, SessionMessage.AssistantReasoning],
    [coreSessionMessage.AssistantContent, SessionMessage.AssistantContent],
    [coreSessionMessage.Assistant, SessionMessage.Assistant],
    [coreSessionMessage.Compaction, SessionMessage.Compaction],
    [coreSessionMessage.Message, SessionMessage.Message],
    [coreSessionTodo.Info, SessionTodo.Info],
    [coreSessionTodo.Event, SessionTodo.Event],
    [corePrompt.Source, Source],
    [corePrompt.FileAttachment, FileAttachment],
    [corePrompt.AgentAttachment, AgentAttachment],
    [corePrompt.Prompt, Prompt],
    [coreSkill.DirectorySource, Skill.DirectorySource],
    [coreSkill.UrlSource, Skill.UrlSource],
    [coreSkill.EmbeddedSource, Skill.EmbeddedSource],
    [coreSkill.Source, Skill.Source],
    [coreSkill.Info, Skill.Info],
    [coreV2Schema.DateTimeUtcFromMillis, DateTimeUtcFromMillis],
    [coreSchema.optional, optional],
    [coreSchema.statics, statics],
    [coreWorkspace.ID, Workspace.ID],
  ]
  for (const [core, shared] of schemas) expect(core).toBe(shared)

  expect(Agent.Info.empty(Agent.ID.make("test"))).toEqual(AgentV2.Info.empty(AgentV2.ID.make("test")))
  expect(Model.Info.empty(Provider.ID.make("test"), Model.ID.make("model"))).toEqual(
    ModelV2.Info.empty(ProviderV2.ID.make("test"), ModelV2.ID.make("model")),
  )
  expect(Provider.Info.empty(Provider.ID.make("test"))).toEqual(ProviderV2.Info.empty(ProviderV2.ID.make("test")))
  expect(Skill.Source.key(Skill.DirectorySource.make({ type: "directory", path: AbsolutePath.make("/tmp") }))).toBe(
    "directory:/tmp",
  )
})

test("shared record schemas construct and decode plain objects", () => {
  const made = Prompt.make({ text: "hello" })
  const decoded = Schema.decodeUnknownSync(Prompt)({ text: "hello" })
  const content = Schema.decodeUnknownSync(SessionMessage.AssistantText)({ type: "text", id: "part_1", text: "hi" })

  expect(Object.getPrototypeOf(made)).toBe(Object.prototype)
  expect(Object.getPrototypeOf(decoded)).toBe(Object.prototype)
  expect(Object.getPrototypeOf(content)).toBe(Object.prototype)
  expect(Prompt.ast.annotations?.identifier).toBe("Prompt")
  expect(SessionMessage.AssistantText.ast.annotations?.identifier).toBe("Session.Message.Assistant.Text")
  expect(Prompt.equivalence(Prompt.make({ text: "hello" }), decoded)).toBe(true)
  expect(Prompt.fromUserMessage({ text: "hello" })).toEqual(made)
  expect(Workspace.ID.ascending("")).toStartWith("wrk_")
})
