import { LayerNode } from "@anymous-ai/core/effect/layer-node"
import { PermissionV1 } from "@anymous-ai/core/v1/permission"
import { Config } from "@/config/config"
import { serviceUse } from "@anymous-ai/core/effect/service-use"
import { Provider } from "@/provider/provider"
import { ConfigMigrateV1 } from "@anymous-ai/core/v1/config/migrate"

import { generateObject, streamObject, type ModelMessage } from "ai"
import { Truncate } from "@/tool/truncate"
import { Auth } from "../auth"
import { ProviderTransform } from "@/provider/transform"
import PROMPT_GENERATE from "./generate.txt"
import PROMPT_BUILD from "./prompt/build.txt"
import PROMPT_PLAN from "./prompt/plan.txt"
import PROMPT_GENERAL from "./prompt/general.txt"
import PROMPT_COMPACTION from "./prompt/compaction.txt"
import PROMPT_EXPLORE from "./prompt/explore.txt"
import PROMPT_SUMMARY from "./prompt/summary.txt"
import PROMPT_TITLE from "./prompt/title.txt"
import PROMPT_CODE_REVIEWER from "./prompt/code-reviewer.txt"
import PROMPT_DEBUG from "./prompt/debug.txt"
import PROMPT_TEST_WRITER from "./prompt/test-writer.txt"
import PROMPT_SECURITY from "./prompt/security.txt"
import PROMPT_FRONTEND from "./prompt/frontend.txt"
import PROMPT_BACKEND from "./prompt/backend.txt"
import PROMPT_DATABASE from "./prompt/database.txt"
import PROMPT_DEVOPS from "./prompt/devops.txt"
import PROMPT_DOCS from "./prompt/docs.txt"
import PROMPT_REFACTOR from "./prompt/refactor.txt"
import PROMPT_ARCHITECT from "./prompt/architect.txt"
import PROMPT_PERFORMANCE from "./prompt/performance.txt"
import PROMPT_WEB_DESIGNER from "./prompt/web-designer.txt"
import PROMPT_REVERSER_STATIC from "./prompt/reverser-static.txt"
import PROMPT_REVERSER_DYNAMIC from "./prompt/reverser-dynamic.txt"
import PROMPT_REVERSER_BINARY from "./prompt/reverser-binary.txt"
import PROMPT_REVERSER_SOURCE from "./prompt/reverser-source.txt"
import PROMPT_REVERSER_AUTOMATOR from "./prompt/reverser-automator.txt"
import PROMPT_MEMORY_DUMP from "./prompt/memory-dump.txt"
import PROMPT_EXE_EXTRACTOR from "./prompt/exe-extractor.txt"
import PROMPT_DEBUG_TOOLS from "./prompt/debug-tools.txt"
import PROMPT_PENTEST_LEAD from "./prompt/pentest-lead.txt"
import PROMPT_PENTEST_RECON from "./prompt/pentest-recon.txt"
import PROMPT_PENTEST_SCANNER from "./prompt/pentest-scanner.txt"
import PROMPT_PENTEST_ENUMERATOR from "./prompt/pentest-enumerator.txt"
import PROMPT_PENTEST_EXPLOITER from "./prompt/pentest-exploiter.txt"
import PROMPT_PENTEST_IDENTITY from "./prompt/pentest-identity.txt"
import PROMPT_PENTEST_WEBAPP from "./prompt/pentest-webapp.txt"
import PROMPT_PENTEST_POSTEXPLOIT from "./prompt/pentest-postexploit.txt"
import PROMPT_PENTEST_CRITIC from "./prompt/pentest-critic.txt"
import PROMPT_PENTEST_REPORTER from "./prompt/pentest-reporter.txt"
import PROMPT_CYBER_ANALYTIC from "./prompt/cyber-analytic.txt"
import PROMPT_SOC from "./prompt/soc.txt"
import PROMPT_FORENSICS from "./prompt/forensics.txt"
import PROMPT_REDTEAM from "./prompt/redteam.txt"
import PROMPT_BLUETEAM from "./prompt/blueteam.txt"
import { Permission } from "@/permission"
import { mergeDeep, pipe, sortBy, values } from "remeda"
import { Global } from "@anymous-ai/core/global"
import path from "path"
import { Plugin } from "@/plugin"
import { Skill } from "../skill"
import { Effect, Context, Layer, Schema } from "effect"
import { InstanceState } from "@/effect/instance-state"
import * as Option from "effect/Option"
import * as OtelTracer from "@effect/opentelemetry/Tracer"
import { AbsolutePath, type DeepMutable } from "@anymous-ai/core/schema"
import { ProviderV2 } from "@anymous-ai/core/provider"
import { ModelV2 } from "@anymous-ai/core/model"
import { LocationServiceMap, locationServiceMapLayer } from "@anymous-ai/core/location-services"
import { Reference } from "@anymous-ai/core/reference"
import { Location } from "@anymous-ai/core/location"
import { PluginV2 } from "@anymous-ai/core/plugin"

export const Info = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  mode: Schema.Literals(["subagent", "primary", "all"]),
  native: Schema.optional(Schema.Boolean),
  hidden: Schema.optional(Schema.Boolean),
  topP: Schema.optional(Schema.Finite),
  temperature: Schema.optional(Schema.Finite),
  color: Schema.optional(Schema.String),
  permission: PermissionV1.Ruleset,
  model: Schema.optional(
    Schema.Struct({
      modelID: ModelV2.ID,
      providerID: ProviderV2.ID,
    }),
  ),
  variant: Schema.optional(Schema.String),
  prompt: Schema.optional(Schema.String),
  options: Schema.Record(Schema.String, Schema.Unknown),
  steps: Schema.optional(Schema.Finite),
}).annotate({ identifier: "Agent" })
export type Info = DeepMutable<Schema.Schema.Type<typeof Info>>

const GeneratedAgent = Schema.Struct({
  identifier: Schema.String,
  whenToUse: Schema.String,
  systemPrompt: Schema.String,
})

export interface Interface {
  readonly get: (agent: string) => Effect.Effect<Info>
  readonly list: () => Effect.Effect<Info[]>
  readonly defaultInfo: () => Effect.Effect<Info>
  readonly defaultAgent: () => Effect.Effect<string>
  readonly generate: (input: {
    description: string
    model?: { providerID: ProviderV2.ID; modelID: ModelV2.ID }
  }) => Effect.Effect<
    {
      identifier: string
      whenToUse: string
      systemPrompt: string
    },
    Provider.DefaultModelError
  >
}

type State = Omit<Interface, "generate">

export class Service extends Context.Service<Service, Interface>()("@anymous/Agent") {}

export const use = serviceUse(Service)

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const config = yield* Config.Service
    const auth = yield* Auth.Service
    const plugin = yield* Plugin.Service
    const skill = yield* Skill.Service
    const provider = yield* Provider.Service
    const locations = yield* LocationServiceMap.Service

    const state = yield* InstanceState.make<State>(
      Effect.fn("Agent.state")(function* (ctx) {
        const cfg = yield* config.get()
        const skillDirs = yield* skill.dirs()
        const referenceDirs = Object.keys(cfg.references ?? cfg.reference ?? {}).length
          ? yield* Effect.gen(function* () {
              yield* (yield* PluginV2.Service).wait(PluginV2.ID.make("core/config-reference"))
              return (yield* (yield* Reference.Service).list()).map((reference) => reference.path)
            }).pipe(Effect.provide(locations.get(Location.Ref.make({ directory: AbsolutePath.make(ctx.directory) }))))
          : []
        const whitelistedDirs = [
          Truncate.GLOB,
          path.join(Global.Path.tmp, "*"),
          ...skillDirs.map((dir) => path.join(dir, "*")),
          ...referenceDirs.map((dir) => path.join(dir, "*")),
        ]
        const readonlyExternalDirectory = {
          "*": "ask",
          ...Object.fromEntries(whitelistedDirs.map((dir) => [dir, "allow"])),
        } satisfies Record<string, "allow" | "ask" | "deny">

        const defaults = Permission.fromConfig({
          "*": "allow",
          doom_loop: "ask",
          external_directory: {
            "*": "ask",
            ...Object.fromEntries(whitelistedDirs.map((dir) => [dir, "allow"])),
          },
          question: "deny",
          plan_enter: "deny",
          plan_exit: "deny",
          // mirrors github.com/github/gitignore Node.gitignore pattern for .env files
          read: {
            "*": "allow",
            "*.env": "ask",
            "*.env.*": "ask",
            "*.env.example": "allow",
          },
        })

        const user = Permission.fromConfig(cfg.permission ?? {})

        const agents: Record<string, Info> = {
          build: {
            name: "build",
            description: "The default agent. Executes tools based on configured permissions.",
            prompt: PROMPT_BUILD,
            options: {},
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                question: "allow",
                plan_enter: "allow",
              }),
              user,
            ),
            mode: "primary",
            native: true,
          },
          plan: {
            name: "plan",
            description: "Plan mode. Disallows all edit tools.",
            prompt: PROMPT_PLAN,
            options: {},
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                question: "allow",
                plan_exit: "allow",
                task: {
                  general: "deny",
                },
                external_directory: {
                  [path.join(Global.Path.data, "plans", "*")]: "allow",
                },
                edit: {
                  "*": "deny",
                  [path.join(".anymous", "plans", "*.md")]: "allow",
                  [path.relative(ctx.worktree, path.join(Global.Path.data, path.join("plans", "*.md")))]: "allow",
                },
              }),
              user,
            ),
            mode: "primary",
            native: true,
          },
          general: {
            name: "general",
            description: `General-purpose agent for researching complex questions and executing multi-step tasks. Use this agent to execute multiple units of work in parallel.`,
            prompt: PROMPT_GENERAL,
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
          },
          explore: {
            name: "explore",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                "*": "deny",
                grep: "allow",
                glob: "allow",
                list: "allow",
                bash: "allow",
                webfetch: "allow",
                websearch: "allow",
                read: "allow",
                external_directory: readonlyExternalDirectory,
              }),
              user,
            ),
            description: `Fast agent specialized for exploring codebases. Use this when you need to quickly find files by patterns (eg. "src/components/**/*.tsx"), search code for keywords (eg. "API endpoints"), or answer questions about the codebase (eg. "how do API endpoints work?"). When calling this agent, specify the desired thoroughness level: "quick" for basic searches, "medium" for moderate exploration, or "very thorough" for comprehensive analysis across multiple locations and naming conventions.`,
            prompt: PROMPT_EXPLORE,
            options: {},
            mode: "subagent",
            native: true,
          },
          compaction: {
            name: "compaction",
            mode: "primary",
            native: true,
            hidden: true,
            prompt: PROMPT_COMPACTION,
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                "*": "deny",
              }),
              user,
            ),
            options: {},
          },
          title: {
            name: "title",
            mode: "primary",
            options: {},
            native: true,
            hidden: true,
            temperature: 0.5,
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                "*": "deny",
              }),
              user,
            ),
            prompt: PROMPT_TITLE,
          },
          summary: {
            name: "summary",
            mode: "primary",
            options: {},
            native: true,
            hidden: true,
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                "*": "deny",
              }),
              user,
            ),
            prompt: PROMPT_SUMMARY,
          },
          "reverser-static": {
            name: "reverser-static",
            description:
              "Specialist in static binary analysis, disassembly, and decompilation. Use for IDA/Ghidra analysis, binary structure evaluation, algorithm extraction.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_REVERSER_STATIC,
          },
          "reverser-dynamic": {
            name: "reverser-dynamic",
            description:
              "Specialist in dynamic/runtime binary analysis, debugging, and instrumentation. Use for Frida, debugger automation, API monitoring, anti-debug bypass.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_REVERSER_DYNAMIC,
          },
          "reverser-binary": {
            name: "reverser-binary",
            description:
              "Specialist in binary formats, packers, and protection analysis. Use for PE/ELF/Mach-O analysis, unpacking, shellcode analysis.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_REVERSER_BINARY,
          },
          "reverser-source": {
            name: "reverser-source",
            description:
              "Specialist in source-level reverse engineering and deobfuscation. Use for pseudocode reconstruction, algorithm recovery, decompilation.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_REVERSER_SOURCE,
          },
          "reverser-automator": {
            name: "reverser-automator",
            description:
              "Specialist in automation, detection engineering, and binary patching. Use for YARA rules, IDAPython scripts, binary patches, loaders.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_REVERSER_AUTOMATOR,
          },
          "memory-dump": {
            name: "memory-dump",
            description:
              "Specialist in memory dumping, analysis, and forensic acquisition. Use for process dump, crash dump analysis, heap inspection, memory forensics with Volatility.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_MEMORY_DUMP,
          },
          "exe-extractor": {
            name: "exe-extractor",
            description:
              "Specialist in extracting executables from packers, installers, and archives. Use for unpacking UPX/Themida/VMProtect, resource extraction, embedded EXE carving.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_EXE_EXTRACTOR,
          },
          "debug-tools": {
            name: "debug-tools",
            description:
              "Specialist in creating custom debugging tools, hook engines, and instrumentation utilities. Use for API monitor creation, DLL injectors, debuggers, runtime patchers.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_DEBUG_TOOLS,
          },
          "pentest-lead": {
            name: "pentest-lead",
            description:
              "Lead strategist and coordinator for penetration testing engagements. Breaks down attacks into phases, dispatches specialist subagents, and tracks engagement state.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_PENTEST_LEAD,
          },
          "pentest-recon": {
            name: "pentest-recon",
            description:
              "Reconnaissance and OSINT specialist. Gathers passive intelligence, discovers subdomains, enumerates technologies, and maps attack surface before active testing.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_PENTEST_RECON,
          },
          "pentest-scanner": {
            name: "pentest-scanner",
            description:
              "Network scanning specialist. Identifies live hosts, open ports, service versions, and OS fingerprints using nmap, masscan, and other scanning tools.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_PENTEST_SCANNER,
          },
          "pentest-enumerator": {
            name: "pentest-enumerator",
            description:
              "Service enumeration specialist. Deeply enumerates SMB, LDAP, DNS, SNMP, HTTP, and database services to extract maximum information.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_PENTEST_ENUMERATOR,
          },
          "pentest-exploiter": {
            name: "pentest-exploiter",
            description:
              "Exploitation specialist. Weaponizes findings to gain initial access, execute known exploits (web, network, AD), and perform credential-based attacks.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_PENTEST_EXPLOITER,
          },
          "pentest-identity": {
            name: "pentest-identity",
            description:
              "Active Directory and identity infrastructure specialist. Performs AD enumeration, Kerberos attacks (AS-REP, Kerberoasting, DCSync), and Azure AD assessment.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_PENTEST_IDENTITY,
          },
          "pentest-webapp": {
            name: "pentest-webapp",
            description:
              "Web application security specialist. Tests OWASP Top 10 (injection, broken access control, SSRF, API security) with comprehensive payload crafting.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_PENTEST_WEBAPP,
          },
          "pentest-postexploit": {
            name: "pentest-postexploit",
            description:
              "Post-exploitation and lateral movement specialist. Escalates privileges, extracts credentials, moves laterally, and establishes persistence across Windows and Linux.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_PENTEST_POSTEXPLOIT,
          },
          "pentest-critic": {
            name: "pentest-critic",
            description:
              "False-positive validator and findings reviewer. Independently verifies every vulnerability, exploit result, and credential before reporting.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_PENTEST_CRITIC,
          },
          "pentest-reporter": {
            name: "pentest-reporter",
            description:
              "Report generation specialist. Compiles all validated findings into professional reports with executive summaries, technical details, CVSS scoring, and remediation plans.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_PENTEST_REPORTER,
          },
          "cyber-analytic": {
            name: "cyber-analytic",
            description:
              "Senior cyber security analyst for SOC/blue team. Threat triage, IOC extraction, MITRE ATT&CK mapping, Sigma/YARA rules, vuln prioritization.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_CYBER_ANALYTIC,
          },
          soc: {
            name: "soc",
            description:
              "SOC incident commander. Triages alerts, dispatches cyber-analytic and forensics, decides contain/escalate/close.",
            prompt: PROMPT_SOC,
            options: {},
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                question: "allow",
                plan_enter: "allow",
              }),
              user,
            ),
            mode: "primary",
            native: true,
          },
          forensics: {
            name: "forensics",
            description:
              "Digital forensics lead. Coordinates memory, binary and timeline analysis with chain of custody.",
            prompt: PROMPT_FORENSICS,
            options: {},
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                question: "allow",
                plan_enter: "allow",
              }),
              user,
            ),
            mode: "primary",
            native: true,
          },
          redteam: {
            name: "redteam",
            description:
              "Offensive security lead for authorized engagements. Runs recon to report via the pentest chain.",
            prompt: PROMPT_REDTEAM,
            options: {},
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                question: "allow",
                plan_enter: "allow",
              }),
              user,
            ),
            mode: "primary",
            native: true,
          },
          blueteam: {
            name: "blueteam",
            description:
              "Defensive security lead. Hardening, detections, security code review and patch prioritization.",
            prompt: PROMPT_BLUETEAM,
            options: {},
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                question: "allow",
                plan_enter: "allow",
              }),
              user,
            ),
            mode: "primary",
            native: true,
          },
          "code-reviewer": {
            name: "code-reviewer",
            description:
              "Code review specialist. Analyzes code for security vulnerabilities, correctness bugs, performance issues, and maintainability concerns with line-level feedback.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
                edit: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_CODE_REVIEWER,
          },
          debug: {
            name: "debug",
            description:
              "Debugging specialist. Systematically diagnoses and fixes software defects by reproducing, isolating, and resolving root causes.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_DEBUG,
          },
          "test-writer": {
            name: "test-writer",
            description:
              "Test engineering specialist. Writes thorough, maintainable tests covering happy path, error cases, edge cases, and boundary conditions.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_TEST_WRITER,
          },
          security: {
            name: "security",
            description:
              "Application security specialist. Assesses code for OWASP Top 10 vulnerabilities, dependency CVEs, secrets exposure, and auth bypasses with CVSS-scored findings.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
                edit: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_SECURITY,
          },
          frontend: {
            name: "frontend",
            description:
              "Senior frontend engineer specializing in React, SolidJS, TypeScript, CSS, accessibility, and web performance. Builds composable UIs with modern best practices.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_FRONTEND,
          },
          backend: {
            name: "backend",
            description:
              "Senior backend engineer specializing in API design, databases, auth, message queues, caching, and observability. Builds scalable server-side systems.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_BACKEND,
          },
          database: {
            name: "database",
            description:
              "Database specialist. Designs schemas, optimizes queries, plans migrations, and advises on data modeling for SQL and NoSQL systems.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
                edit: "deny", // advisory only — schema changes via backend agent
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_DATABASE,
          },
          devops: {
            name: "devops",
            description:
              "DevOps/platform engineer specializing in CI/CD, Docker, Kubernetes, cloud infrastructure (AWS/GCP/Azure), IaC, and observability.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_DEVOPS,
          },
          docs: {
            name: "docs",
            description:
              "Technical documentation specialist. Writes clear READMEs, API references, guides, ADRs, and troubleshooting docs with code examples.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
                edit: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_DOCS,
          },
          refactor: {
            name: "refactor",
            description:
              "Code refactoring specialist. Improves code structure — extracts duplication, simplifies complexity, renames for clarity — without changing behavior.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_REFACTOR,
          },
          architect: {
            name: "architect",
            description:
              "Software architect. Designs system-level solutions, evaluates technology trade-offs, produces ADRs, and creates implementation roadmaps.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
                edit: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_ARCHITECT,
          },
          performance: {
            name: "performance",
            description:
              "Performance optimization specialist. Profiles and optimizes CPU, memory, I/O, network, rendering, and build bottlenecks with measured improvements.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
                edit: "deny", // advisory — changes via refactor/build agent
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_PERFORMANCE,
          },
          "web-designer": {
            name: "web-designer",
            description:
              "Web design specialist. Creates polished UI with HTML, CSS, Tailwind, Three.js, glassmorphism, animations, and responsive layouts.",
            permission: Permission.merge(
              defaults,
              Permission.fromConfig({
                todowrite: "deny",
              }),
              user,
            ),
            options: {},
            mode: "subagent",
            native: true,
            prompt: PROMPT_WEB_DESIGNER,
          },
        }

        for (const [key, value] of Object.entries(cfg.agent ?? {})) {
          const migrated = ConfigMigrateV1.migrateAgent(value)
          if (migrated.disabled) {
            delete agents[key]
            continue
          }
          let item = agents[key]
          if (!item)
            item = agents[key] = {
              name: key,
              mode: "all",
              permission: Permission.merge(defaults, user),
              options: {},
              native: false,
            }
          if (migrated.model) item.model = Provider.parseModel(migrated.model)
          item.variant = migrated.variant ?? item.variant
          item.prompt = migrated.system ?? item.prompt
          item.description = migrated.description ?? item.description
          item.mode = migrated.mode ?? item.mode
          item.color = migrated.color ?? item.color
          item.hidden = migrated.hidden ?? item.hidden
          item.name = value.name ?? item.name
          item.steps = migrated.steps ?? item.steps
          const body = migrated.request?.body ?? {}
          const { temperature, top_p, ...options } = body
          item.temperature = temperature ?? item.temperature
          item.topP = top_p ?? item.topP
          item.options = mergeDeep(item.options, options)
          if (migrated.permissions) {
            item.permission = Permission.merge(
              item.permission,
              migrated.permissions.map((rule) => ({
                permission: rule.action,
                pattern: rule.resource,
                action: rule.effect,
              })),
            )
          }
        }

        // Ensure Truncate.GLOB is allowed unless explicitly configured
        for (const name in agents) {
          const agent = agents[name]
          const explicit = agent.permission.some((r) => {
            if (r.permission !== "external_directory") return false
            if (r.action !== "deny") return false
            return r.pattern === Truncate.GLOB
          })
          if (explicit) continue

          agents[name].permission = Permission.merge(
            agents[name].permission,
            Permission.fromConfig({ external_directory: { [Truncate.GLOB]: "allow" } }),
          )
        }

        const get = Effect.fnUntraced(function* (agent: string) {
          return agents[agent]
        })

        const list = Effect.fnUntraced(function* () {
          const cfg = yield* config.get()
          return pipe(
            agents,
            values(),
            sortBy(
              [(x) => (cfg.default_agent ? x.name === cfg.default_agent : x.name === "build"), "desc"],
              [(x) => x.name, "asc"],
            ),
          )
        })

        const defaultInfo = Effect.fnUntraced(function* () {
          const c = yield* config.get()
          if (c.default_agent) {
            const agent = agents[c.default_agent]
            if (!agent) throw new Error(`default agent "${c.default_agent}" not found`)
            if (agent.mode === "subagent") throw new Error(`default agent "${c.default_agent}" is a subagent`)
            if (agent.hidden === true) throw new Error(`default agent "${c.default_agent}" is hidden`)
            return agent
          }
          const visible = Object.values(agents).find((a) => a.mode !== "subagent" && a.hidden !== true)
          if (!visible) throw new Error("no primary visible agent found")
          return visible
        })

        const defaultAgent = Effect.fnUntraced(function* () {
          return (yield* defaultInfo()).name
        })

        return {
          get,
          list,
          defaultInfo,
          defaultAgent,
        } satisfies State
      }),
    )

    return Service.of({
      get: Effect.fn("Agent.get")(function* (agent: string) {
        return yield* InstanceState.useEffect(state, (s) => s.get(agent))
      }),
      list: Effect.fn("Agent.list")(function* () {
        return yield* InstanceState.useEffect(state, (s) => s.list())
      }),
      defaultInfo: Effect.fn("Agent.defaultInfo")(function* () {
        return yield* InstanceState.useEffect(state, (s) => s.defaultInfo())
      }),
      defaultAgent: Effect.fn("Agent.defaultAgent")(function* () {
        return yield* InstanceState.useEffect(state, (s) => s.defaultAgent())
      }),
      generate: Effect.fn("Agent.generate")(function* (input: {
        description: string
        model?: { providerID: ProviderV2.ID; modelID: ModelV2.ID }
      }) {
        const cfg = yield* config.get()
        const model = input.model ?? (yield* provider.defaultModel())
        const resolved = yield* provider.getModel(model.providerID, model.modelID)
        const language = yield* provider.getLanguage(resolved)
        const tracer = cfg.experimental?.openTelemetry
          ? Option.getOrUndefined(yield* Effect.serviceOption(OtelTracer.OtelTracer))
          : undefined

        const system = [PROMPT_GENERATE]
        yield* plugin.trigger("experimental.chat.system.transform", { model: resolved }, { system })
        const existing = yield* InstanceState.useEffect(state, (s) => s.list())

        // TODO: clean this up so provider specific logic doesnt bleed over
        const authInfo = yield* auth.get(model.providerID).pipe(Effect.orDie)
        const isOpenaiOauth = model.providerID === "openai" && authInfo?.type === "oauth"

        const params = {
          experimental_telemetry: {
            isEnabled: cfg.experimental?.openTelemetry,
            tracer,
            metadata: {
              userId: cfg.username ?? "unknown",
            },
          },
          temperature: 0.3,
          messages: [
            ...(isOpenaiOauth
              ? []
              : system.map(
                  (item): ModelMessage => ({
                    role: "system",
                    content: item,
                  }),
                )),
            {
              role: "user",
              content: `Create an agent configuration based on this request: "${input.description}".\n\nIMPORTANT: The following identifiers already exist and must NOT be used: ${existing.map((i) => i.name).join(", ")}\n  Return ONLY the JSON object, no other text, do not wrap in backticks`,
            },
          ],
          model: language,
          schema: Object.assign(
            Schema.toStandardSchemaV1(GeneratedAgent),
            Schema.toStandardJSONSchemaV1(GeneratedAgent),
          ),
        } satisfies Parameters<typeof generateObject>[0]

        if (isOpenaiOauth) {
          return yield* Effect.promise(async () => {
            const result = streamObject({
              ...params,
              providerOptions: ProviderTransform.providerOptions(resolved, {
                instructions: system.join("\n"),
                store: false,
              }),
              onError: () => {},
            })
            for await (const part of result.fullStream) {
              if (part.type === "error") throw part.error
            }
            return result.object
          })
        }

        return yield* Effect.promise(() => generateObject(params).then((r) => r.object))
      }),
    })
  }),
)

const locationServiceMapNode = LayerNode.make({
  service: LocationServiceMap.Service,
  layer: locationServiceMapLayer,
  deps: [],
})

export const node = LayerNode.make({
  service: Service,
  layer: layer,
  deps: [Config.node, Auth.node, Plugin.node, Skill.node, Provider.node, locationServiceMapNode],
})

export * as Agent from "./agent"
