# anymous — AI-Powered Reverse Engineering & Pentest Platform

**39 specialized AI agents**, orchestrated by **Any**. Voice in pt-BR (offline). Unrestricted mode.

```bash
npm install -g anymous
anymous
```

## Quick start

```bash
# Talk to the orchestrator (it delegates to the 38 specialists)
anymous run --agent any "faz pentest neste host"

# Voice (pt-BR, 100% offline — Piper TTS + faster-whisper STT)
anymous voice "Olá, esta é a voz do Any"
anymous voice --loop

# Web UI
anymous web
```

## Agents

- **any** — always-on orchestrator, 100% unrestricted
- **RE (8)**: reverser-static, reverser-dynamic, reverser-binary, reverser-source,
  reverser-automator, memory-dump, exe-extractor, debug-tools
- **Pentest (10)**: pentest-lead, pentest-recon, pentest-scanner, pentest-enumerator,
  pentest-exploiter, pentest-identity, pentest-webapp, pentest-postexploit,
  pentest-critic, pentest-reporter
- **cyber-analytic** — SOC/blue-team analyst (triage, MITRE ATT&CK, Sigma/YARA)
- **Engineering (20)**: build, plan, frontend, backend, docs, security, debug, etc.

## Providers

Works with any opencode-compatible provider (OpenAI, Anthropic, Google, OpenRouter…).
Free models available via the `opencode` provider (e.g. `opencode/nemotron-3-ultra-free`)
with `OPENCODE_API_KEY` — no per-model key needed per session.

See full docs at https://anymous-cli.vercel.app and https://github.com/anymousdark/anymous.

MIT License.
