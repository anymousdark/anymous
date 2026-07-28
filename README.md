# anymous — AI-Powered Reverse Engineering & Pentest Platform

**18 specialized AI agents** for reverse engineering, penetration testing, and software analysis. Built on a fork of opencode v11, fully rebranded and enhanced with unrestricted mode.

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

# Run
anymous
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

## 📄 License

MIT — fork of [opencode](https://github.com/anomalyco/opencode) v11.

---

*Built for reverse engineers, penetration testers, and security researchers.*
