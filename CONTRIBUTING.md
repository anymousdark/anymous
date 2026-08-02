# Contributing to anymous

Thank you for your interest in contributing! This project is a fork of opencode v11, rebranded and enhanced for reverse engineering and penetration testing.

## Quick Start

```bash
# Prerequisites
# - Bun >= 1.2.x (required, does not run on Node.js)
# - Git

# Clone
git clone https://github.com/anymousdark/anymous-ai.git
cd anymous-ai

# Install dependencies
bun install

# Run development CLI
cd packages/anymous
bun dev
```

## Project Structure

This is a **Bun workspaces monorepo** with 30+ packages. Key packages:

| Package | Purpose |
|---------|---------|
| `packages/anymous/` | Main CLI entry point (npm package `anymous`) |
| `packages/core/` | Core runtime, Effect services, Drizzle/SQLite |
| `packages/tui/` | Terminal UI (SolidJS + @opentui) |
| `packages/app/` | Web application (Vite + SolidJS) |
| `packages/server/` | HTTP API server |
| `packages/llm/` | Native LLM provider integrations |
| `packages/plugin/` | Plugin system (v2 Effect-native) |

## Development Workflow

### Type Checking

```bash
# Focused typecheck (recommended - avoids OOM on full check)
bunx --bun tsgo -p packages/anymous/tsconfig.json --noEmit

# Or check a specific package
bunx --bun tsgo -p packages/core/tsconfig.json --noEmit
```

> **Note**: Full monorepo typecheck (`bunx --bun tsgo --noEmit`) may OOM on machines with < 8GB RAM. Use focused checks per package.

### Running Tests

```bash
# All tests in CLI package
bun test

# With coverage
bun test --coverage

# Specific test file
bun test packages/anymous/test/agent/agent.test.ts
```

### Building

```bash
# Build CLI binary (single platform)
cd packages/anymous
bun run script/build.ts --single --skip-install

# Prepare npm package
bun run script/prepare-npm.ts
```

### Linting

```bash
# Lint entire monorepo
bunx eslint . --ext .ts,.tsx
```

## Code Style & Conventions

### TypeScript / Effect

- Use `Effect.gen(function* () { ... })` for composition
- Use `Effect.fn("Domain.method")` for named/traced effects
- Prefer `Effect.void` over `Effect.succeed(undefined)`
- Use `Schema.Class` for multi-field data, `Schema.brand` for single-value types
- Use `Schema.TaggedErrorClass` for typed errors

### Module Organization

- Flat top-level exports + self-reexport at bottom:
  ```ts
  export const thing = ...
  export * as Module from "."
  ```
- No namespace exports (`export namespace Foo`)
- In multi-sibling directories (`src/session/`, `src/config/`), import specific siblings

### Runtime vs InstanceState

- Use `makeRuntime` (from `src/effect/run-service.ts`) for services
- Use `InstanceState` (from `src/effect/instance-state.ts`) for per-directory/project state
- Do work directly in `InstanceState.make` closure; `ScopedCache` handles run-once

### Agent Prompts

- All prompts are plain text files in `packages/anymous/src/agent/prompt/`
- Each agent has its own file (e.g., `reverser-static.txt`, `pentest-lead.txt`)
- Prompts define persona, tools, and constraints
- Unrestricted mode: no content filtering, full tool access

## Git Workflow

### Branch Naming

- `feature/<short-description>` — new features
- `fix/<short-description>` — bug fixes
- `docs/<short-description>` — documentation
- `refactor/<short-description>` — code improvements

### Commit Messages

Follow conventional commits:

```
type(scope): short description

Longer description if needed.

Refs: #issue-number
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`

### Pull Requests

1. Fork the repo
2. Create a feature branch from `dev`
3. Make changes with tests
4. Run lint + typecheck + tests locally
5. Open PR against `dev` branch
6. CI must pass (lint, typecheck, test, build)

## Testing Guidelines

- Write tests for new functionality in `packages/anymous/test/`
- Use `bun test` with Effect test utilities
- Integration tests use `bun test --coverage`
- E2E tests (Playwright) in `packages/app/test/`

## Release Process

1. Version bump in `packages/anymous/script/prepare-npm.ts`
2. Run `bun run script/prepare-npm.ts`
3. Test locally: `cd packages/anymous/dist-npm && bun link`
4. `npm publish --access public`
5. Git tag: `git tag v1.x.x && git push origin v1.x.x`
6. GitHub Release: `bun run script/publish.ts`

## Reporting Issues

- Use GitHub Issues with templates (when available)
- Include: Bun version, OS, reproduction steps, expected vs actual behavior
- For security issues, email the maintainer directly

## Code of Conduct

Be respectful. This project is for security research and reverse engineering education. Do not use for unauthorized access.

## License

MIT — by contributing, you agree your contributions will be licensed under MIT.

---

**Maintainer**: anymousdark (<aychero56@gmail.com>)
**Upstream**: Fork of opencode v11 (anomalyco/opencode)