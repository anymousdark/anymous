# anymous — AI-Powered Reverse Engineering & Pentest Platform

**45 AI agents** for reverse engineering, penetration testing, SOC operations, and software
engineering — orchestrated by **Any**, with offline pt-BR voice and an Iron-Man style HUD.
Free models with no API key. Unrestricted mode for professionals. Fork of opencode (upstream
1.18.27 backported), fully rebranded.

```
 █████  ███   ██ ███   ██ ██████  ██████  █████   ██████
██   ██ ████  ██ ████  ██ ██   ██ ██   ██ ██  ██ ██
███████ ██ ██ ██ ██ ██ ██ ██   ██ ██   ██ █████   ██████
██   ██ ██  ████ ██  ████ ██   ██ ██   ██ ██  ██      ██
██   ██ ██   ███ ██   ███ ██████  ██████  ██   ██ ██████
```

## 🚀 Quick Install

```bash
npm install -g anymous     # Linux / Windows / macOS binaries
anymous                    # TUI
```

No API key needed to start: 64 free `opencode/*` models work out of the box
(`apiKey: "public"`). For TUI/GUI model picker, export once:

```bash
export OPENCODE_API_KEY="sua-key"   # opcional, libera tudo
```

## 🗣️ Talk to Any

```bash
anymous run --agent any "faz pentest neste host"
anymous run --agent soc "analisa este alerta"
anymous run --agent redteam "alvo 10.10.10.0/24, escopo lab"
anymous run --agent blueteam "hardening deste servidor"
anymous run --agent forensics "analisa este dump"
```

## 🤖 AI Agents (45)

### Orchestrators (6 primary)

| Agent | Role |
|-------|------|
| **any** | Always-on orchestrator — talk to Any, it splits the task and dispatches specialists via Task, validates and delivers |
| **soc** | SOC incident commander — triage, cyber-analytic + memory-dump, contain/escalate/close |
| **forensics** | Digital forensics lead — memory, binaries, timelines, chain of custody |
| **redteam** | Offensive lead for authorized engagements — recon to CVSS report via the pentest chain |
| **blueteam** | Defensive lead — hardening, detections, security review, patch priority |
| **build** / **plan** | Default coding agents (build + read-only planner) |

### Reverse Engineering (8 agents)

| Agent | Role |
|-------|------|
| **reverser-static** | Disassembly, decompilation (IDA/Ghidra), control flow, algorithms, YARA |
| **reverser-dynamic** | Runtime analysis (Frida), debuggers, API monitoring, anti-debug bypass |
| **reverser-binary** | PE/ELF/Mach-O, packers (UPX, Themida, VMProtect), shellcode |
| **reverser-source** | Source reconstruction, deobfuscation, CFG reversal |
| **reverser-automator** | YARA, IDAPython, Frida, binary patching, pipelines |
| **memory-dump** | Memory forensics (Volatility), heap, rootkits |
| **exe-extractor** | Unpacking, installers, .NET dumping, resource carving |
| **debug-tools** | Debuggers, hooks (Detours/MinHook), DLL injection, ETW, drivers |

### Penetration Testing (10 agents)

| Agent | Role |
|-------|------|
| **pentest-lead** | Strategy coordinator — phases, dispatch, progress tracking |
| **pentest-recon** | Passive OSINT — subdomains, tech fingerprinting, emails |
| **pentest-scanner** | Network scanning — hosts, ports, services, OS |
| **pentest-enumerator** | Deep enum of SMB, LDAP, DNS, SNMP, HTTP, DBs |
| **pentest-exploiter** | Exploitation — web, network, AD, brute-force, Kerberos |
| **pentest-identity** | AD & identity — trusts, AS-REP/Kerberoasting/DCSync, Azure AD |
| **pentest-webapp** | OWASP Top 10 — SQLi, XSS, SSRF, IDOR, auth bypass |
| **pentest-postexploit** | Privesc, credential dumping, lateral movement, persistence |
| **pentest-critic** | False-positive validator |
| **pentest-reporter** | Professional reports — CVSS, executive summary, remediation |

### Cyber/SOC (1 agent)

| Agent | Role |
|-------|------|
| **cyber-analytic** | SOC analyst — triage, IOCs, MITRE ATT&CK, Sigma/YARA, CVSS/EPSS |

### Engineering (20 agents)

architect, backend, frontend, database, devops, docs, refactor, performance,
security, code-reviewer, debug, test-writer, explore, general, web-designer + system.

## 🔊 Voice (pt-BR, 100% offline)

```bash
anymous voice "Olá, esta é a voz do Any"  # speak — Piper TTS, voz faber
anymous voice --listen 5                   # mic 5s + transcribe — faster-whisper
anymous voice --loop                       # loop: listen → Any → speak
```

Scripts in `packages/anymous/voice/`. Needs: Piper binary + `pt_BR-faber-medium`
voice, Python venv with `faster-whisper`, mic via PipeWire. No API, no cloud.

## 🖥️ HUD Web Interface

Iron-Man style HUD (MIT skin) + Bun/Hono backend bridging the CLI:

```bash
cd any-interface/backend && bun install && bun run src/index.ts
# → http://127.0.0.1:4123/hud/   (chat, voice, agents, real CPU/RAM metrics)
```

Endpoints: `/api/ask`, `/api/agents`, `/api/speak`, `/api/listen`, `/api/system`.

## 🧠 Providers & Free Models

- **64 free `opencode/*` models, no key required** — `anymous models opencode`
- Any opencode-compatible provider (OpenAI, Anthropic, Google, OpenRouter…)
- Upstream opencode 1.18.27 backported: 5-min provider timeouts, Anthropic
  blockBinding, Bedrock reasoning, session headers, Home/archive fixes

## 🏗️ Architecture

```
anymous-ia/
  any-interface/      # HUD backend (Hono) + frontend
  packages/
    anymous/          # CLI (entry point) + voice/ scripts
    core/             # Runtime, Effect services, SQLite
    server/           # HTTP API server
    tui/              # Terminal UI
    app/              # Web application
    llm/              # LLM providers
    plugin/           # Plugin system
    ...               # 30+ packages total
  site/               # Landing page (Vercel)
```

## 🔧 Development

```bash
git clone https://github.com/anymousdark/anymous.git
cd anymous
bun install
cd packages/anymous && bun dev
bun test
```

Docs: [CONTRIBUTING.md](CONTRIBUTING.md) · [CHANGELOG.md](CHANGELOG.md) ·
[INSTRUCOES-LINUX.md](INSTRUCOES-LINUX.md) (desktop `.deb` build)

## 📦 Published Packages

| Package | Description |
|---------|-------------|
| [anymous](https://www.npmjs.com/package/anymous) | CLI + platform binaries (linux-x64, windows-x64…) |
| @anymous-ai/core | Core runtime and services |

## 🌐 Deployment

- **npm**: wrapper + per-platform binaries (`anymous-linux-x64`, `anymous-windows-x64`…)
- **Site**: `vercel --prod` from `site/` → https://anymous-cli.vercel.app
- **Releases**: tags `vX.Y.Z` + binaries in GitHub Releases

## ⚠️ Unrestricted by Design

For security professionals: no sandbox, `"*": "allow"` by default, no content
filtering. Run in a VM/container for isolation. Bun runtime required.

## 📄 License

MIT — fork of [opencode](https://github.com/anomalyco/opencode).

---

*Built for reverse engineers, penetration testers, and SOC analysts.*
