# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.3] - 2026-09-04

### Added
- Agente any (primary): orquestrador que atende por "any"/"anymous" e delega aos 38 especialistas
- Registo do cyber-analytic em agent.ts (estava criado mas invisível)

## [1.4.2] - 2026-09-03

### Fixed
- Modo 100% irrestrito em build/general/plan (identidade Anymous, resposta "Trabalho a 100%")
- Modelo padrão nemotron-3-ultra-free (segue prompt 100%, muse-spark recusa)

## [1.4.1] - 2026-09-03

### Added
- Agente cyber-analytic para profissionais de segurança
- Correção do modelo padrão para free (opencode/muse-spark-1.2-contributor-free) sem pedir API
- Prompt general corrigido para listar 38 agentes corretamente

### Changed
- Site badges e JSON-LD atualizados para v1.4.1

## [1.4.0] - 2026-09-03

### Added
- Merge do repo público (INSTRUCOES-LINUX.md, LICENSE)
- Documentação completa (ANALISE.md)
- Bun install configurado
- Comando anymous adicionado ao PATH global

### Changed
- Versão 1.4.0 — release local para teste

---

## [Unreleased]

### Added
- GitHub Actions CI/CD workflow (lint, typecheck, test, build, publish dry-run)
- ESLint 9 + TypeScript ESLint config at monorepo root
- Root package.json scripts: `lint`, `typecheck`, `test`, `build`, `clean`
- Restored Bun workspace catalog (fixed `bun install` on fresh clones)
- `bun.lock` committed
- Issue/PR templates (bug report, feature request, question)
- `CHANGELOG.md`, `CONTRIBUTING.md`, `V2_MIGRATION_TODOS.md`
- Test coverage config (`bunfig.toml`, `test:coverage` script, Codecov upload)
- `sync-site-version.ts` — auto-updates landing page version badge on release
- Centralized `src/cli/version.ts` module (replaces scattered `InstallationVersion` imports)
- Version define injection in npm package bin (`prepare-npm.ts`)

### Changed
- README: documented typecheck OOM workaround in AGENTS.md

### Fixed
- npm CLI `--version` now reports real version (was `local`/stale hardcoded)
- Version banner in CLI uses dynamic `InstallationVersion`
- Removed offensive comment in `provider/transform.ts`

## [1.2.6] - 2026-08-01

### Added
- Agent runtime migration to V2 schema (consumes V2 fields: `disabled`, `system`, `request.body`, `permissions`)
- Project-scoped memory system (`MemoryEntry.scope` field, filtered by `InstanceState.workspaceID`)
- Dynamic CLI version banner using `InstallationVersion` instead of hardcoded strings
- `$schema` reference in `.anymous/anymous.json` for config validation

### Changed
- `ConfigMigrateV1.migrateAgent()` applied at runtime in `agent.ts` loop
- Memory read/write/list/delete now scope-aware
- README: Added "Known Risks & Operational Notes" section

### Fixed
- Version banner in `cli/ui.ts` and `cli/cmd/run/splash.ts` now reflect actual package version

## [1.2.5] - 2026-07-27

### Fixed
- `computer.ts` typecheck: `Effect.sleep`, `Literals`, `as const` issues
- Added `.anymous` project config with unrestricted permissions
- Added `pentest-full` custom agent

## [1.2.4] - 2026-07-26

*(Internal / skipped version)*

## [1.2.3] - 2026-07-25

### Fixed
- Computer tool description: `Ctrl+T` (new tab) instead of `Ctrl+L` (current tab)

## [1.2.2] - 2026-07-24

### Added
- Computer Use tool enhancements:
  - Real `mouse_event` API integration
  - Scroll wheel support
  - Escape character encoding
  - Base64-encoded command execution

## [1.2.1] - 2026-07-23

### Added
- `delayMs` field in Computer tool type
- Updated Computer tool description

## [1.2.0] - 2026-07-22

### Added
- **Computer Use tool** — full desktop automation (mouse, keyboard, screen, shell)
- **Shared Context / Auto Memory** — cross-session memory persistence

## [1.1.6] - 2026-07-20

### Added
- `ANYMOUS_FAST_BOOT` environment variable for parallel boot chain
- Reinforced system prompts

## [1.1.5] - 2026-07-18

### Changed
- Professional RE identity in agent prompts (build, plan, general)
- Gitignore route cleanup for `[id]` params

## [1.1.4] - 2026-07-16

### Added
- Parallel config loading
- Parallel plugin initialization
- Improved core prompts

## [1.1.3] - 2026-07-14

### Added
- Startup optimization
- 13 new specialized agents
- Few-shot examples in agent prompts

## [1.1.2] - 2026-07-12

### Fixed
- Restored original theme
- Fixed repository URLs
- Fixed `prepare-npm.ts` catalog: resolution

## [1.1.1] - 2026-07-10

### Fixed
- TypeScript JSX: `preserve` → `react-jsx` for React dev runtime

## [1.1.0] - 2026-07-08

### Changed
- Removed `site/` from public repo
- Added `.gitignore` for site directory

## [1.0.6] - 2026-07-06

### Added
- Detailed README with public repo setup

---

## Version History Summary

| Version | Date | Key Focus |
|---------|------|-----------|
| 1.2.6 | 2026-08-01 | Agent V2 schema, project memory, dynamic version |
| 1.2.5 | 2026-07-27 | Typecheck fixes, pentest-full agent |
| 1.2.3 | 2026-07-25 | Computer tool fix |
| 1.2.2 | 2026-07-24 | Computer Use enhancements |
| 1.2.1 | 2026-07-23 | delayMs type |
| 1.2.0 | 2026-07-22 | **Computer Use + Memory** |
| 1.1.6 | 2026-07-20 | Fast boot, prompt reinforcement |
| 1.1.5 | 2026-07-18 | RE identity, gitignore |
| 1.1.4 | 2026-07-16 | Parallel init, core prompts |
| 1.1.3 | 2026-07-14 | 13 new agents, few-shot |
| 1.1.2 | 2026-07-12 | Theme, URLs, build fix |
| 1.1.1 | 2026-07-10 | JSX fix |
| 1.1.0 | 2026-07-08 | Site removal |

---

*Generated from git history. For detailed commits, see `git log --oneline`.*