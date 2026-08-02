# V2 Migration Roadmap

Tracking of deferred V2 migration work identified as TODO comments in the codebase.
This document consolidates the work so it can be prioritized and tracked.

## Immediate Priority (blocks other work)

| Area | Location | What |
|------|----------|------|
| Formatter integration | `core/src/tool/write.ts:42`, `core/src/tool/edit.ts:85`, `core/src/file-mutation.ts:201` | Wire V2 formatter runtime after it exists |
| Watcher/file-edit events | `core/src/file-mutation.ts:202`, `core/src/tool/write.ts:43`, `core/src/tool/edit.ts:86` | Publish watcher/file-edit events after V2 watcher integration |

## Medium Priority (feature gaps)

| Area | Location | What |
|------|----------|------|
| Snapshots / undo | `core/src/file-mutation.ts:203`, `core/src/tool/write.ts:44`, `core/src/tool/edit.ts:87` | Add file snapshots and undo after design exists |
| LSP diagnostics | `core/src/file-mutation.ts:204`, `core/src/tool/write.ts:45`, `core/src/tool/edit.ts:88` | Notify LSP and collect diagnostics after V2 LSP runtime |
| Multi-file transactions | `core/src/file-mutation.ts:205` | Design multi-file transactions / rollback for atomic apply_patch |
| Crash recovery | `core/src/file-mutation.ts:207` | Define crash recovery and idempotency for side effects between Tool.Called and durable settlement |
| Edit fuzzy correction | `core/src/tool/edit.ts:84` | Port V1 fuzzy strategies: line-trimmed matching, block-anchor fallback, indentation correction, similarity threshold |
| Background jobs | `core/src/tool/bash.ts:70-77` | Durable job status, restart recovery, remote observation, process-group cleanup, binary output handling |
| Model schema naming | `core/src/tool/write.ts:21` | Revisit absolute `filePath` naming after evaluating model behavior |

## Low Priority (nice-to-have)

| Area | Location | What |
|------|----------|------|
| Bash parser approval | `core/src/tool/bash.ts:66-69` | tree-sitter bash/PowerShell parser-based approval reduction, BashArity reuse, external-directory detection |
| Plugin env hooks | `core/src/tool/bash.ts:71` | Add plugin `shell.env` augmentation once V2 plugin hooks exist |
| Durable projectors | `core/src/event.ts:180` | Bind durable projectors to exact type+version before supporting incompatible historical payloads |
| Session sync | `core/src/session.ts:260` | Restore recorded sessions onto replacement synchronized workspaces |
| URI materialization | `core/src/session/runner/to-llm-message.ts:41` | Materialize remote and managed URIs before provider-history lowering |
| Model deployment sync | `core/src/catalog.ts:239` | Remove provider-specific assumptions once model syncing reliably reports deployments |

## Other tracked TODOs

- `packages/anymous/src/tool/tool.ts:15` — remove the "hack" in tool module
- `packages/anymous/src/provider/transform.ts:98` — optimize `normalizeMessages` (multiple passes)
- `packages/anymous/src/session/session.ts:400` — update models.dev pricing model
- `packages/anymous/src/agent/agent.ts:904` — clean up provider-specific logic bleed
- `packages/anymous/src/account/account.ts:435` — multi-org selection
- `packages/server/src/handlers/pty.ts:178` — graceful-shutdown socket tracking
- `packages/tui/src/parsers-config.ts:153` — tree-sitter injections; `:287` — official tree-sitter-nix WASM
- `packages/core/src/github-copilot/chat/openai-compatible-chat-language-model.ts:386` — lost type safety on Chunk (MUST FIX)

## Notes

- This list was compiled on 2026-08-01 from a repo-wide TODO scan.
- Items marked "after V2 X exists" depend on infrastructure that does not exist yet.
- When completing an item, remove it from this list and update the code comment.
