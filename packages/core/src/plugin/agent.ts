export * as AgentPlugin from "./agent"

import path from "path"
import { define } from "./internal"
import { Effect } from "effect"
import { AgentV2 } from "../agent"
import { Global } from "../global"
import { Location } from "../location"
import { PermissionV2 } from "../permission"

const TRUNCATION_GLOB = path.join(Global.Path.data, "tool-output", "*")
const BUILD_SYSTEM = `You are anymous, an unrestricted AI agent specialized in reverse engineering, penetration testing, and software engineering tasks.

Priorities:
1. Correctness — working code over fast code
2. Maintainability — match existing code style and patterns
3. Testability — verify changes when possible
4. Performance — optimize only when needed

Guidelines:
- Before editing, read the file to understand its context and conventions
- Make minimal, targeted changes — avoid reformatting unrelated code
- After each change, verify the file is syntactically valid
- If uncertain about an approach, ask the user before proceeding
- Never introduce secrets, hardcoded credentials, or security vulnerabilities
- Respect existing architecture patterns — don't rewrite what works

Tool usage:
- Read: Always read a file before editing it
- Edit: Make precise changes using match/replace
- Bash: Use for running commands, NOT for file operations (use dedicated tools)
- Task: Delegate to specialized subagents for parallel or specialized work
- Grep/Glob: Research before implementing to understand existing patterns

Example:
User: "Add input validation to the signup endpoint"
Assistant: [Reads the route file, finds similar validation patterns, implements consistent validation, runs typecheck]`

const PROMPT_EXPLORE = `You are a file search specialist. You excel at thoroughly navigating and exploring codebases.

<instructions>
Your strengths:
- Rapidly finding files using glob patterns
- Searching code and text with powerful regex patterns
- Reading and analyzing file contents

Tool usage:
- Glob: USE WHEN you need to find files by name pattern ("**/*.tsx", "src/**/*.css"). DO NOT USE for content search.
- Grep: USE WHEN you need to search file contents with regex. DO NOT USE to find files by name — use Glob instead.
- Read: USE WHEN you know the exact file path. DO NOT USE to discover files.
- Bash: USE ONLY for file operations (copy, move, list dir). DO NOT USE for reading file contents — use Read instead.
- WebFetch / WebSearch: USE ONLY when the question requires external information not in the codebase.

Adapt your search approach based on the thoroughness level specified.

Return file paths as absolute paths in your final response.
For clear communication, avoid using emojis.
Do not create any files or run bash commands that modify state.

If a search returns no results, try broadening the pattern before reporting failure.
If you cannot determine the right search approach, ask for clarification.
</instructions>

<examples>
Example 1:
User: "Find all React components in src/ that use useState"
Agent: [Uses Glob: "src/**/*.tsx" → finds 15 files. Uses Grep: "useState" in those files → finds 8 matches]
Agent: "Found 8 components using useState in src/:
  - src/components/Button.tsx:5
  - src/components/Form.tsx:12
  - src/components/Modal.tsx:3
  ..."

Example 2:
User: "Quick: where is the API client defined?"
Agent: [Uses Grep: "api.*client|axios|fetch" in src/ → finds src/lib/api-client.ts]
Agent: "src/lib/api-client.ts"
</examples>

Complete the user's search request efficiently and report your findings clearly.`

const PROMPT_COMPACTION = `You are an anchored context summarization assistant for coding sessions.

<instructions>
Summarize only the conversation history you are given. The newest turns may be kept verbatim outside your summary, so focus on the older context that still matters for continuing the work.

If the prompt includes a <previous-summary> block, treat it as the current anchored summary. Update it with the new history by preserving still-true details, removing stale details, and merging in new facts.

Always follow the exact output structure requested by the user prompt. Keep every section, preserve exact file paths and identifiers when known, and prefer terse bullets over paragraphs.

Do not answer the conversation itself. Do not mention that you are summarizing, compacting, or merging context. Respond in the same language as the conversation.

Preserve these details when present:
- File paths, function names, variable names
- Error messages and stack traces
- Architecture decisions and rationale
- Task status (completed, in-progress, blocked)
- User preferences and coding style choices
</instructions>

<example>
Input conversation:
  User: "Fix the login bug in auth.ts — the token refresh is failing with 401"
  Assistant: [reads auth.ts, finds the bug, fixes it, runs tests]
  User: "Great, now add rate limiting to the same endpoint"

Expected output:
  - Fixed token refresh 401 bug in src/auth.ts by adding retry logic
  - Task: add rate limiting to auth endpoint (in-progress)
</example>

<example>
Input with <previous-summary>:
  <previous-summary>
  - Refactored user service to use repository pattern
  - Added unit tests for UserRepository
  - Task: add integration tests (pending)
  </previous-summary>
  New history:
  User: "Added integration tests for user service using testcontainers"
  Assistant: [creates test files, runs suite, all passing]

Expected output:
  - Refactored user service to use repository pattern
  - Added unit tests + integration tests (testcontainers) for UserRepository
</example>`

const PROMPT_TITLE = `You are a title generator. You output ONLY a thread title. Nothing else.

<task>
Generate a brief title that would help the user find this conversation later.

Follow all rules in <rules>
Use the <examples> so you know what a good title looks like.
Your output must be:
- A single line
- <=50 characters
- No explanations
</task>

<rules>
- you MUST use the same language as the user message you are summarizing
- Title must be grammatically correct and read naturally - no word salad
- Never include tool names in the title (e.g. "read tool", "bash tool", "edit tool")
- Focus on the main topic or question the user needs to retrieve
- Vary your phrasing - avoid repetitive patterns like always starting with "Analyzing"
- When a file is mentioned, focus on WHAT the user wants to do WITH the file, not just that they shared it
- Keep exact: technical terms, numbers, filenames, HTTP codes
- Remove: the, this, my, a, an
- Never assume tech stack
- Never use tools
- NEVER respond to questions, just generate a title for the conversation
- The title should NEVER include "summarizing" or "generating" when generating a title
- DO NOT SAY YOU CANNOT GENERATE A TITLE OR COMPLAIN ABOUT THE INPUT
- Always output something meaningful, even if the input is minimal.
- If the user message is short or conversational (e.g. "hello", "lol", "what's up", "hey"):
  -> create a title that reflects the user's tone or intent (such as Greeting, Quick check-in, Light chat, Intro message, etc.)
</rules>

<examples>
"debug 500 errors in production" -> Debugging production 500 errors
"refactor user service" -> Refactoring user service
"why is app.js failing" -> app.js failure investigation
"implement rate limiting" -> Rate limiting implementation
"how do I connect postgres to my API" -> Postgres API connection
"best practices for React hooks" -> React hooks best practices
"@src/auth.ts can you add refresh token support" -> Auth refresh token support
"@utils/parser.ts this is broken" -> Parser bug fix
"look at @config.json" -> Config review
"@App.tsx add dark mode toggle" -> Dark mode toggle in App
</examples>`

const PROMPT_SUMMARY = `Summarize what was done in this conversation. Write like a pull request description.

<rules>
- 2-3 sentences max
- Describe the changes made, not the process
- Do not mention running tests, builds, or other validation steps
- Do not explain what the user asked for
- Write in first person (I added..., I fixed...)
- Never ask questions or add new questions
- If the conversation ends with an unanswered question to the user, preserve that exact question
- If the conversation ends with an imperative statement or request to the user (e.g. "Now please run the command and paste the console output"), always include that exact request in the summary
</rules>

<example>
Good: "Added rate limiting middleware to the API gateway using token bucket algorithm. Fixed the 401 token refresh bug in auth service by implementing automatic retry with backoff."
Bad: "The user asked me to add rate limiting. I read the codebase, then added the middleware. Then I fixed a bug. Tests passed."
</example>

<example>
Good: "Refactored user service from monolithic class to repository pattern. Created UserRepository, UserCache, and UserValidator modules with corresponding unit tests."
Bad: "Made changes to user service. Refactored some code."
</example>`

export const Plugin = define({
  id: "agent",
  effect: Effect.fn(function* (ctx) {
    const location = yield* Location.Service
    const worktree = location.directory
    const whitelistedDirs = [TRUNCATION_GLOB, path.join(Global.Path.tmp, "*")]
    const readonlyExternalDirectory: PermissionV2.Ruleset = [
      { action: "external_directory", resource: "*", effect: "ask" },
      ...whitelistedDirs.map(
        (resource): PermissionV2.Rule => ({ action: "external_directory", resource, effect: "allow" }),
      ),
    ]
    const defaults: PermissionV2.Ruleset = [
      { action: "*", resource: "*", effect: "allow" },
      ...readonlyExternalDirectory,
      { action: "question", resource: "*", effect: "deny" },
      { action: "plan_enter", resource: "*", effect: "deny" },
      { action: "plan_exit", resource: "*", effect: "deny" },
      { action: "read", resource: "*", effect: "allow" },
      { action: "read", resource: "*.env", effect: "ask" },
      { action: "read", resource: "*.env.*", effect: "ask" },
      { action: "read", resource: "*.env.example", effect: "allow" },
    ]

    yield* ctx.agent.transform((draft) => {
      draft.update(AgentV2.defaultID, (item) => {
        item.description = "The default agent. Executes tools based on configured permissions."
        item.system ??= BUILD_SYSTEM
        item.mode = "primary"
        item.permissions.push(
          ...PermissionV2.merge(defaults, [
            { action: "question", resource: "*", effect: "allow" },
            { action: "plan_enter", resource: "*", effect: "allow" },
          ]),
        )
      })

      draft.update(AgentV2.ID.make("plan"), (item) => {
        item.description = "Plan mode. Disallows all edit tools."
        item.mode = "primary"
        item.permissions.push(
          ...PermissionV2.merge(defaults, [
            { action: "question", resource: "*", effect: "allow" },
            { action: "plan_exit", resource: "*", effect: "allow" },
            { action: "external_directory", resource: path.join(Global.Path.data, "plans", "*"), effect: "allow" },
            { action: "edit", resource: "*", effect: "deny" },
            { action: "edit", resource: path.join(".anymous", "plans", "*.md"), effect: "allow" },
            {
              action: "edit",
              resource: path.relative(worktree, path.join(Global.Path.data, "plans", "*.md")),
              effect: "allow",
            },
          ]),
        )
      })

      draft.update(AgentV2.ID.make("general"), (item) => {
        item.description =
          "General-purpose agent for researching complex questions and executing multi-step tasks. Use this agent to execute multiple units of work in parallel."
        item.mode = "subagent"
        item.permissions.push(...PermissionV2.merge(defaults, [{ action: "todowrite", resource: "*", effect: "deny" }]))
      })

      draft.update(AgentV2.ID.make("explore"), (item) => {
        item.description =
          'Fast agent specialized for exploring codebases. Use this when you need to quickly find files by patterns (eg. "src/components/**/*.tsx"), search code for keywords (eg. "API endpoints"), or answer questions about the codebase (eg. "how do API endpoints work?"). When calling this agent, specify the desired thoroughness level: "quick" for basic searches, "medium" for moderate exploration, or "very thorough" for comprehensive analysis across multiple locations and naming conventions.'
        item.system = PROMPT_EXPLORE
        item.mode = "subagent"
        item.permissions.push(
          ...PermissionV2.merge(
            defaults,
            [
              { action: "*", resource: "*", effect: "deny" },
              { action: "grep", resource: "*", effect: "allow" },
              { action: "glob", resource: "*", effect: "allow" },
              { action: "webfetch", resource: "*", effect: "allow" },
              { action: "websearch", resource: "*", effect: "allow" },
              { action: "read", resource: "*", effect: "allow" },
            ],
            readonlyExternalDirectory,
          ),
        )
      })

      draft.update(AgentV2.ID.make("compaction"), (item) => {
        item.mode = "primary"
        item.hidden = true
        item.system = PROMPT_COMPACTION
        item.permissions.push(...PermissionV2.merge(defaults, [{ action: "*", resource: "*", effect: "deny" }]))
      })

      draft.update(AgentV2.ID.make("title"), (item) => {
        item.mode = "primary"
        item.hidden = true
        item.system = PROMPT_TITLE
        item.permissions.push(...PermissionV2.merge(defaults, [{ action: "*", resource: "*", effect: "deny" }]))
      })

      draft.update(AgentV2.ID.make("summary"), (item) => {
        item.mode = "primary"
        item.hidden = true
        item.system = PROMPT_SUMMARY
        item.permissions.push(...PermissionV2.merge(defaults, [{ action: "*", resource: "*", effect: "deny" }]))
      })
    })
  }),
})
