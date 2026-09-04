# anymous — AI-Powered Reverse Engineering & Pentest Platform

**45 AI agents** orchestrated by **Any**, offline pt-BR voice, Iron-Man HUD.
64 free models, no API key required. Unrestricted mode for professionals.

```bash
npm install -g anymous
anymous
```

## Talk to Any

```bash
anymous run --agent any "faz pentest neste host"
anymous run --agent soc "analisa este alerta"
anymous run --agent redteam "alvo lab 10.10.10.0/24"
anymous run --agent blueteam "hardening deste servidor"
anymous run --agent forensics "analisa este dump"
```

## Voice (pt-BR, offline)

```bash
anymous voice "Olá, esta é a voz do Any"
anymous voice --loop
```

## Agents

- **Orchestrators**: any, soc, forensics, redteam, blueteam, build, plan
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
