# anymous — AI-Powered Reverse Engineering & Pentest Platform

**44 AI agents** for reverse engineering, pentest, SOC and engineering.
64 free models, no API key required. Unrestricted mode for professionals.

```bash
npm install -g anymous
anymous
```

## Quick Tasks

```bash
anymous run --agent soc "analisa este alerta"
anymous run --agent redteam "alvo lab 10.10.10.0/24"
anymous run --agent blueteam "hardening deste servidor"
anymous run --agent forensics "analisa este dump"
```

## Agents

- **Leads**: soc, forensics, redteam, blueteam, build, plan
- **RE (8)**: reverser-static, reverser-dynamic, reverser-binary, reverser-source,
  reverser-automator, memory-dump, exe-extractor, debug-tools
- **Pentest (10)**: pentest-lead, pentest-recon, pentest-scanner, pentest-enumerator,
  pentest-exploiter, pentest-identity, pentest-webapp, pentest-postexploit,
  pentest-critic, pentest-reporter
- **cyber-analytic** (SOC), **engineering (20)**

## Providers

64 free `opencode/*` models out of the box, plus any opencode-compatible
provider (OpenAI, Anthropic, Google, OpenRouter…).

Docs: https://anymous-cli.vercel.app · Code: https://github.com/anymousdark/anymous

MIT License.
