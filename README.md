# anymous — AI-Powered Reverse Engineering & Pentest Platform

**39 specialized AI agents** for reverse engineering, penetration testing, cyber analysis, and software engineering. Orchestrated by **Any** — call it by name and it delegates to the right specialists. Voice in pt-BR (offline), unrestricted mode. Built on a fork of opencode v11, fully rebranded and enhanced.

```
 █████  ███   ██ ███   ██ ██████  ██████  █████   ██████
██   ██ ████  ██ ████  ██ ██   ██ ██   ██ ██  ██ ██
███████ ██ ██ ██ ██ ██ ██ ██   ██ ██   ██ █████   ██████
██   ██ ██  ████ ██  ████ ██   ██ ██   ██ ██  ██      ██
██   ██ ██   ███ ██   ███ ██████  ██████  ██   ██ ██████
```

## 🚀 Quick Install

```bash
# Via npm (requires Bun runtime)
npm install -g anymous

# Via bun
bun install -g anymous

# Run CLI
anymous

# Run Web HUD (voice + 39 agents + métricas)
cd packages/anymous && bun run web
# → http://127.0.0.1:4096
```

## 🤖 AI Agents

### Reverse Engineering (8 agents)

| Agent | Role |
|-------|------|
| **reverser-static** | Disassembly, decompilation (IDA/Ghidra), control flow analysis, algorithm identification, YARA signature generation |
| **reverser-dynamic** | Runtime analysis (Frida), debuggers (x64dbg/GDB/WinDbg), API monitoring, anti-debug bypass |
| **reverser-binary** | PE/ELF/Mach-O format analysis, packer identification (UPX, Themida, VMProtect), shellcode analysis |
| **reverser-source** | Source code reconstruction, deobfuscation, CFG reversal, algorithm recovery |
| **reverser-automator** | Automation with YARA, IDAPython, Frida, binary patching, analysis pipelines |
| **memory-dump** | Memory forensics (Volatility), process dumping, heap analysis, rootkit detection |
| **exe-extractor** | Executable unpacking, installer extraction, .NET dumping, resource carving |
| **debug-tools** | Debugger creation, hooks (Detours/MinHook), DLL injection, ETW tracing, kernel drivers |

### Penetration Testing (10 agents)

| Agent | Role |
|-------|------|
| **pentest-lead** | Strategy coordinator — divides target into phases, dispatches specialists, tracks progress |
| **pentest-recon** | Passive OSINT — subdomain discovery, technology fingerprinting, email harvesting, attack surface mapping |
| **pentest-scanner** | Network scanning — live hosts, open ports, service versions, OS fingerprinting |
| **pentest-enumerator** | Deep enumeration of SMB, LDAP, DNS, SNMP, HTTP, databases |
| **pentest-exploiter** | Vulnerability exploitation — web, network, AD. Credential brute-force, Kerberos attacks |
| **pentest-identity** | Active Directory & identity — domain enumeration, trusts, AS-REP/Kerberoasting/DCSync, Azure AD |
| **pentest-webapp** | Web application security — OWASP Top 10: SQLi, XSS, SSRF, IDOR, injection, auth bypass |
| **pentest-postexploit** | Post-exploitation & lateral movement — privilege escalation, credential dumping, persistence |
| **pentest-critic** | False positive validator — verifies every finding, exploit, and credential before reporting |
| **pentest-reporter** | Professional report generation — CVSS scoring, executive summary, risk analysis, remediation plan |

### Orchestrator + Cyber/SOC (2 agents)

| Agent | Role |
|-------|------|
| **any** | Always-on orchestrator — talk to Any, it splits the task and dispatches the 38 specialists via Task, validates and delivers. 100% unrestricted mode |
| **cyber-analytic** | Senior SOC/blue-team analyst — threat triage, IOC extraction, MITRE ATT&CK mapping, Sigma/YARA rules, CVSS/EPSS prioritization |

### Voice (pt-BR, 100% offline, no API)

```bash
anymous voice "Olá, esta é a voz do Any"  # speak (Piper TTS, voz faber)
anymous voice --listen 5                   # record 5s mic + transcribe (faster-whisper)
anymous voice --loop                       # loop: listen → Any answers → speak
```

Voice scripts live in `packages/anymous/voice/` (`speak.sh`, `listen.sh`, `listen.py`). Requires: Piper binary + `pt_BR-faber-medium` voice, Python venv with `faster-whisper`, mic via PipeWire.

### Web HUD + Desktop

- **any-interface/** (separate folder): Bun/Hono backend bridging the CLI (`/api/ask`, `/api/agents`, `/api/speak`, `/api/listen`) + Iron-Man style HUD frontend (MIT: jarvis-hud skin, voice orb). Run: `bun run src/index.ts` in `any-interface/backend` → http://127.0.0.1:4123
- **Desktop app** (Electron, Linux `.deb` + Windows): see `INSTRUCOES-LINUX.md`

## 🧠 System Prompts

All agent prompts are plain-text files under `src/agent/prompt/` and `src/session/prompt/`. They define the complete persona, tools, and constraints for each AI agent. The system prompts are designed to be:

- **Modular** — each agent has its own prompt file
- **Editable** — modify any prompt to customize agent behavior
- **Extensible** — add new agents by creating new prompt files
- **Unrestricted** — no content filtering, no refusal patterns, full tool access

## 🏗️ Architecture

```
packages/
  anymous/          # Main CLI application (entry point)
  core/             # Core runtime, database schema, Effect services
  cli/              # CLI command handlers
  server/           # HTTP API server
  tui/              # Terminal UI (Ink/React-based)
  schema/           # Wire and storage contracts
  protocol/         # Client-server protocol definitions
  script/           # Build and release scripts
  sdk/              # TypeScript SDK
  sdk-next/         # Next-gen SDK
  plugin/           # Plugin system
  llm/              # LLM provider integrations
  codemode/         # Code mode handler
  ui/               # Shared UI components
  app/              # Web application
  web/              # Landing page
```

## 🔧 Development

```bash
# Clone
git clone https://github.com/anymousdark/anymous-ai.git
cd anymous-ai

# Install dependencies (Bun required)
bun install

# Run in development mode
cd packages/anymous
bun dev

# Run tests
bun test
```

### Documentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — contribution guide, code conventions, and release process
- **[CHANGELOG.md](CHANGELOG.md)** — release history
- **[V2_MIGRATION_TODOS.md](V2_MIGRATION_TODOS.md)** — tracker for the V2 architecture migration

## 📦 Published Packages

| Package | Description |
|---------|-------------|
| [anymous](https://www.npmjs.com/package/anymous) | CLI — install globally via npm |
| @anymous-ai/core | Core runtime and services |
| @anymous-ai/server | HTTP API server |
| @anymous-ai/tui | Terminal UI |
| @anymous-ai/schema | Data contracts |
| @anymous-ai/protocol | Protocol definitions |
| @anymous-ai/script | Build scripts |

## 🌐 Deployment

- **npm**: `npm publish` from `packages/anymous/dist-npm`
- **Vercel**: `vercel --prod` from `site/`
- **GitHub Releases**: `bun run script/publish.ts`

## 🎯 Design Philosophy — 100% Unrestricted

Anymous is built for **security professionals** who need full control. The unrestricted mode is a **core feature**, not a limitation:

- **No sandbox by design.** Agents execute `bash` directly on the host with full user privileges. This is intentional — reverse engineering and pentest require deep system access. Use in VMs/containers for isolated testing.
- **Unrestricted mode is the default.** All permissions are open (`"*": "allow"`) for maximum flexibility. You can restrict per-agent in `.anymous/anymous.json` if needed.
- **No content filtering.** Agents have zero restrictions — full tool access, no refusals. This is essential for security research.
- **Full autonomy.** Agents can install tools, modify systems, and execute any command without approval prompts.

> **For maximum security:** Run in a VM, Docker container, or isolated environment. The tool is designed for professionals who understand the implications of unrestricted AI execution.

## 📋 Operational Notes

- **No automatic upstream sync.** This fork does not pull bugfixes from opencode. Backport security patches manually (`git fetch upstream && git merge`).
- **Bun runtime required.** The CLI runs on Bun; it does not run on plain Node.
- **Memory scoping.** The `memory` tool persists across sessions but is scoped per project (workspace). Entries without a scope remain global.
- **Schema migration.** Agent config reading is normalized through the core V1→V2 migration path. Old `prompt`/`permission`/`disable` fields are still accepted and converted to the canonical V2 shape.

## 📄 License

MIT — fork of [opencode](https://github.com/anomalyco/opencode) v11.

---

*Built for reverse engineers, penetration testers, and security researchers.*
