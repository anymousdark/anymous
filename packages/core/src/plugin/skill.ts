/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill"

import { define } from "./internal"
import { Effect } from "effect"
import { AbsolutePath } from "../schema"
import { SkillV2 } from "../skill"
import customizeanymousContent from "./skill/customize-anymous.md" with { type: "text" }

export const CustomizeanymousContent = customizeanymousContent

export const Plugin = define({
  id: "skill",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.skill.transform((draft) => {
      draft.source(
        SkillV2.EmbeddedSource.make({
          type: "embedded",
          skill: SkillV2.Info.make({
            name: "customize-anymous",
            description:
              "Use ONLY when the user is editing or creating anymous's own configuration: anymous.json, anymous.jsonc, files under .anymous/, or files under ~/.config/anymous/. Also use when creating or fixing anymous agents, subagents, commands, skills, plugins, MCP servers, or permission rules. Do not use for the user's own application code, or for any project that is not configuring anymous itself.",
            location: AbsolutePath.make("/builtin/customize-anymous.md"),
            content: CustomizeanymousContent,
          }),
        }),
      )
    })
  }),
})
