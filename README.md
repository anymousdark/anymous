<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:1e3a8a,100:06b6d4&height=200&section=header&text=ANYMOUS&fontSize=64&fontColor=ffffff&animation=fadeIn" alt="anymous" />
</p>

<p align="center">
  <a href="https://github.com/anymousdark/anymous"><img src="https://readme-typing-svg.herokuapp.com?font=JetBrains+Mono&size=22&pause=1000&color=58A6FF&center=true&vCenter=true&width=700&lines=43+AI+agents+for+offensive+security;Reverse+engineering+%2B+pentest+%2B+SOC;Free+models+%2B+local+Ollama+%2B+your+keys;Unrestricted+mode+for+professionals" alt="typing" /></a>
</p>

# anymous — AI-Powered Reverse Engineering & Pentest Platform

[![Release](https://img.shields.io/github/v/release/anymousdark/anymous)](https://github.com/anymousdark/anymous/releases)
[![CI](https://github.com/anymousdark/anymous/actions/workflows/ci.yml/badge.svg)](https://github.com/anymousdark/anymous/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<p>
  <img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SolidJS-2C4F7C?style=for-the-badge&logo=solid&logoColor=white" alt="SolidJS" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

**43 AI agents** for reverse engineering, penetration testing, SOC operations and software
engineering. Unrestricted mode for professionals. Fork of opencode, fully rebranded.

> Current version: **v1.7.0** — see [CHANGELOG.md](CHANGELOG.md).

## Quick Install

```bash
npm install -g anymous   # platform binaries, no install scripts
anymous                  # TUI
```

Without any key, use a local model via Ollama (`ollama pull qwen3`) or connect
a provider (`anymous providers login`). The `opencode/*` free models require your
own key — they only work keyless inside the official OpenCode app.

## Quick Tasks

<p>
  <img src="https://readme-typing-svg.herokuapp.com?font=JetBrains+Mono&size=18&pause=800&color=34D399&width=700&lines=%24+anymous+run+--agent+soc+%22analisa+este+alerta%22;%24+anymous+run+--agent+redteam+%22alvo+10.10.10.0%2F24%2C+escopo+lab%22;%24+anymous+%23+TUI" alt="demo" />
</p>

```bash
anymous run --agent soc "analisa este alerta"
anymous run --agent redteam "alvo 10.10.10.0/24, escopo lab"
anymous run --agent blueteam "hardening deste servidor"
anymous run --agent forensics "analisa este dump"
```

## AI Agents (43)

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

## Providers & Models

- **`opencode` via `OPENCODE_API_KEY`** — 80+ models including free ones such as
  `opencode/muse-spark-1.3-contributor-free` and `opencode/big-pickle`.
  `anymous models opencode`
- **`opencode-go` / `anyapi`** via stored key (`anymous providers login`)
- **Local Ollama** — no key, no account (`ollama pull qwen3`)
- Any OpenAI-compatible provider (OpenAI, Anthropic, Google, OpenRouter...)
- Upstream opencode backports: provider timeouts, Anthropic blockBinding,
  Bedrock reasoning, session headers, Home/archive fixes

Set the default in `anymous.json`:

```json
{
  "$schema": "https://anymous-cli.vercel.app/config.json",
  "model": "opencode/muse-spark-1.3-contributor-free"
}
```

## Architecture

```
anymous/
  packages/
    anymous/          # CLI (entry point)
    core/             # Runtime, Effect services, SQLite
    server/           # HTTP API server
    tui/              # Terminal UI
    app/              # Web application
    llm/              # LLM providers
    plugin/           # Plugin system
    ...               # 30+ packages total
  site/               # Landing page (Vercel)
```

## Development

```bash
git clone https://github.com/anymousdark/anymous.git
cd anymous
bun install
cd packages/anymous && bun dev
bun test
```

Docs: [CONTRIBUTING.md](CONTRIBUTING.md) · [CHANGELOG.md](CHANGELOG.md) ·
[INSTRUCOES-LINUX.md](INSTRUCOES-LINUX.md) (desktop `.deb` build)

## Published Packages

| Package | Description |
|---------|-------------|
| [anymous](https://www.npmjs.com/package/anymous) | CLI + platform binaries (linux-x64, windows-x64...) |
| @anymous-ai/core | Core runtime and services |

## Deployment

- **npm**: wrapper + per-platform binaries (`anymous-linux-x64`, `anymous-windows-x64`...)
- **Site**: `vercel --prod` from `site/` → https://anymous-cli.vercel.app
- **Releases**: tags `vX.Y.Z` + binaries in GitHub Releases

## Unrestricted by Design

For security professionals: no sandbox, `"*": "allow"` by default, no content
filtering. Run in a VM/container for isolation. Bun runtime required.

## License

MIT — fork of [opencode](https://github.com/sst/opencode).

---

*Built for reverse engineers, penetration testers, and SOC analysts.*

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:06b6d4,100:1e3a8a&height=120&section=footer&animation=fadeIn" alt="footer" />
</p>
