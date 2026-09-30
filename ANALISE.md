# Anymous IA - Análise Completa do Projeto

## O que é o Anymous?

O **Anymous** é uma plataforma de **Engenharia Reversa e Pentest** baseada em IA, construída como um fork do **opencode v11** (CLI de IA para coding). Ele transforma o opencode em uma ferramenta de segurança ofensiva com **39 agentes especializados** que trabalham de forma autônoma e cooperativa.

---

## Arquitetura Geral

```
anymous-ia/
├── .anymous/              # Configuração local do projeto
│   ├── anymous.json       # Permissões e config (unrestricted mode)
│   └── agents/            # Agentes customizados locais
│       └── pentest-full.md
├── packages/              # Monorepo com 30+ pacotes
│   ├── anymous/           # CLI principal (ponto de entrada)
│   ├── core/              # Runtime core, Effect services, Drizzle/SQLite
│   ├── server/            # API HTTP
│   ├── tui/               # Terminal UI (SolidJS + @opentui)
│   ├── llm/               # Integrações com providers LLM
│   ├── plugin/            # Sistema de plugins
│   ├── schema/            # Contratos de dados
│   ├── protocol/          # Definições de protocolo client-server
│   ├── sdk/               # SDK TypeScript
│   ├── app/               # Aplicação web (Vite + SolidJS)
│   ├── web/               # Landing page
│   ├── cli/               # Handlers de comandos CLI
│   ├── codemode/          # Handler de modo código
│   ├── ui/                # Componentes UI compartilhados
│   ├── script/            # Scripts de build/release
│   └── ...                # Outros pacotes
├── site/                  # Landing page estática (deploy Vercel)
├── package.json           # Root do monorepo (workspaces)
└── bun.lock               # Lock do Bun
```

**Tech Stack:**
- **Runtime:** Bun (não Node.js)
- **Linguagem:** TypeScript
- **Framework reativo:** Effect (programação funcional)
- **UI:** SolidJS + @opentui (terminal) + Vite (web)
- **Banco:** Drizzle ORM + SQLite
- **Build:** Bun workspaces
- **Deploy:** Vercel (site), npm (CLI)

---

## Os 39 Agentes de IA

### Engenharia Reversa (8 agentes)

| Agente | Função |
|--------|--------|
| `reverser-static` | Desassembly, decompilação (IDA/Ghidra), análise de fluxo, identificação de algoritmos, assinaturas YARA |
| `reverser-dynamic` | Análise runtime (Frida), debuggers (x64dbg/GDB/WinDbg), monitoramento de API, bypass de anti-debug |
| `reverser-binary` | Análise de formatos PE/ELF/Mach-O, identificação de packers (UPX, Themida, VMProtect), shellcode |
| `reverser-source` | Reconstrução de código fonte, desobfuscação, reversão de CFG, recuperação de algoritmos |
| `reverser-automator` | Automação com YARA, IDAPython, Frida, binary patching, pipelines de análise |
| `memory-dump` | Forense de memória (Volatility), dump de processos, análise de heap, detecção de rootkits |
| `exe-extractor` | Unpacking de executáveis, extração de instaladores, dump .NET, carving de recursos |
| `debug-tools` | Criação de debuggers, hooks (Detours/MinHook), DLL injection, ETW tracing, drivers kernel |

### Pentest (10 agentes)

| Agente | Função |
|--------|--------|
| `pentest-lead` | Coordenador de estratégia — divide o alvo em fases, despacha especialistas, acompanha progresso |
| `pentest-recon` | OSINT passivo — descoberta de subdomínios, fingerprinting tecnológico, coleta de emails |
| `pentest-scanner` | Scan de rede — hosts ativos, portas abertas, versões de serviços, fingerprinting de OS |
| `pentest-enumerator` | Enumeração profunda de SMB, LDAP, DNS, SNMP, HTTP, bancos de dados |
| `pentest-exploiter` | Exploração de vulnerabilidades — web, rede, AD. Brute-force, ataques Kerberos |
| `pentest-identity` | Active Directory & identidade — enumeração de domínio, trusts, AS-REP/Kerberoasting/DCSync, Azure AD |
| `pentest-webapp` | Segurança de aplicações web — OWASP Top 10: SQLi, XSS, SSRF, IDOR, auth bypass |
| `pentest-postexploit` | Pós-exploração e movimentação lateral — escalação de privilégios, dump de credenciais, persistência |
| `pentest-critic` | Validador de falsos positivos — verifica cada achado, exploit e credencial antes do relatório |
| `pentest-reporter` | Geração de relatórios profissionais — CVSS, resumo executivo, análise de risco, plano de remediação |

### Agentes Gerais / Suporte

| Agente | Função |
|--------|--------|
| `general` | Agente geral para pesquisa complexa e tarefas multi-step |
| `build` | Build e compilação |
| `plan` | Planejamento de tarefas |
| `debug` | Debug e diagnóstico |
| `frontend` | Desenvolvimento frontend |
| `backend` | Desenvolvimento backend |
| `docs` | Documentação |
| outros... | |

---

## Como Funciona o Sistema de Agentes

### 1. Prompts (Personalidade de cada agente)

Cada agente tem um arquivo `.txt` em `packages/anymous/src/agent/prompt/`:

```
packages/anymous/src/agent/prompt/
├── reverser-static.txt      # Personalidade + instruções do agente
├── pentest-lead.txt
├── pentest-recon.txt
├── pentest-scanner.txt
├── pentest-enumerator.txt
├── pentest-exploiter.txt
├── pentest-identity.txt
├── pentest-webapp.txt
├── pentest-postexploit.txt
├── pentest-critic.txt
├── pentest-reporter.txt
├── general.txt
├── build.txt
├── plan.txt
├── debug.txt
├── frontend.txt
├── backend.txt
├── docs.txt
├── ...
```

Cada prompt define:
- **Persona** — quem o agente é
- **Ferramentas** — quais tools pode usar
- **Instruções** — como se comportar
- **Exemplos** — exemplos de entrada/saída
- **Handoff** — quando delegar para outro agente

### 2. Configuração de Permissões (`.anymous/anymous.json`)

```json
{
  "permission": {
    "*": "allow",           // Tudo permitido
    "bash": { "*": "allow" },
    "read": { "*": "allow" },
    "write": { "*": "allow" },
    "edit": { "*": "allow" },
    "task": { "*": "allow" }
  },
  "default_agent": "build"
}
```

**Modo Unrestricted:** Quando `"*": "allow"`, os agentes executam bash diretamente no host sem sandbox.

### 3. Agentes Customizados (`.anymous/agents/`)

Agentes locais definidos em Markdown com frontmatter:

```markdown
---
mode: "subagent"
description: "Pentest/reversing com acesso total"
permission:
  "*": "allow"
---
# Pentest/Reverse Engineering - Acesso Total
Você tem acesso irrestrito a TODAS as ferramentas.
```

---

## Fluxo de Trabalho de um Pentest

```
Usuário: "Faça pentest em 10.10.10.50"
        │
        ▼
┌─────────────────┐
│  pentest-lead   │ ← Coordenador, divide em fases
└────────┬────────┘
         │
    ┌────┴────┐──────────────┐
    ▼         ▼              ▼
┌────────┐ ┌────────┐  ┌──────────┐
│recon   │ │scanner │  │recon     │  ← Fase 1: Coleta
└────┬───┘ └────┬───┘  └────┬─────┘
     │          │            │
     └──────────┴────────────┘
                │
                ▼
         ┌──────────┐
         │enumerator│ ← Fase 2: Enumeração
         └────┬─────┘
              │
     ┌────────┴────────┐
     ▼                 ▼
┌──────────┐    ┌──────────┐
│exploiter │    │webapp    │ ← Fase 3: Exploração
└────┬─────┘    └────┬─────┘
     │               │
     └───────┬───────┘
             ▼
      ┌──────────┐
      │identity  │ ← Active Directory
      └────┬─────┘
           ▼
      ┌──────────┐
      │postexploit│ ← Fase 4: Pós-exploração
      └────┬─────┘
           ▼
      ┌──────────┐
      │critic    │ ← Validação (remove falsos positivos)
      └────┬─────┘
           ▼
      ┌──────────┐
      │reporter  │ ← Fase 5: Relatório final
      └──────────┘
```

---

## Stack Técnico Detalhado

### Dependências Principais

| Categoria | Tecnologia |
|-----------|-----------|
| Runtime | Bun >= 1.2.x |
| Linguagem | TypeScript 5.8 |
| Efeito/Functor | Effect 4.0.0-beta.83 |
| ORM | Drizzle ORM 1.0.0-rc.2 |
| Banco | SQLite (via @effect/sql-sqlite-bun) |
| UI Terminal | SolidJS + @opentui |
| UI Web | SolidJS + Vite 7.1 + TailwindCSS 4.1 |
| LLM | ai 6.0.168 (Vercel AI SDK) |
| HTTP | Hono 4.10 |
| Schema | Zod 4.1 |
| Deploy | Vercel, npm |

### Scripts Disponíveis

```bash
bun install          # Instalar dependências
bun dev              # Rodar CLI em dev
bun test             # Rodar testes
bun test --coverage  # Testes com cobertura
bun run build        # Build do CLI (single platform)
bun run build:all    # Build para todas as plataformas
bun run lint         # ESLint
bun run typecheck    # Typecheck (pode dar OOM em máquinas < 8GB)
bun run clean        # Limpar dists e node_modules
```

### CI/CD (GitHub Actions)

**CI (`ci.yml`):**
1. **Lint** — ESLint em todos os packages
2. **Typecheck** — Focused por package (evita OOM)
3. **Test** — Bun test com coverage + Codecov
4. **Build** — Build do CLI
5. **Publish Dry Run** — Só no push para `dev`

**Deploy Site (`deploy-site.yml`):**
- Deploy automático para Vercel quando arquivos em `site/` mudam

---

## Como Rodar

### Requisitos
- Bun >= 1.2.x
- Git
- (Opcional) LLM API key (OpenAI, Anthropic, etc.)

### Setup

```bash
# Clonar
git clone https://github.com/anymousdark/anymous-backup.git
cd anymous-backup

# Instalar dependências
bun install

# Rodar
cd packages/anymous
bun dev
```

### Configuração de LLM

Configure sua API key via variável de ambiente ou config file:

```bash
export OPENAI_API_KEY="sk-..."
# ou
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Deploy do Site (Vercel)

```bash
cd site
vercel --prod
```

---

## Filosofia de Design — 100% Irrestrito

O Anymous é construído para **profissionais de segurança** que precisam de controle total. O modo unrestricted é uma **feature core**, não uma limitação:

| Característica | Descrição |
|----------------|-----------|
| **Sem sandbox por design** | Agentes executam bash direto no host com permissões completas do usuário — intencional para engenharia reversa e pentest |
| **Modo unrestricted é o padrão** | Todas as permissões abertas (`"*": "allow"`) para máxima flexibilidade |
| **Sem filtragem de conteúdo** | Agentes sem restrições, acesso total a ferramentas |
| **Autonomia total** | Agentes podem instalar ferramentas, modificar sistemas, executar qualquer comando sem aprovação |

**Recomendações:**
- Rodar em VM, container Docker ou ambiente isolado para testes
- Usar em ambientes com dados sensíveis apenas com isolamento de rede
- Monitorar logs de agentes quando necessário

---

## Notas Operacionais

- **Sem sync automático** — Fork não recebe patches do upstream (opencode)
- **Bun obrigatório** — Não roda em Node.js puro
- **Memory scoping** — Memory persiste entre sessões mas é escopo por projeto

---

## Estrutura de Módulos (Effect)

O projeto usa **Effect** (programação funcional reativa) extensivamente:

```typescript
// Padrão de módulo
export const thing = ...
export * as Module from "."

// Uso
import { Module } from "@/module/thing"
yield* Module.Service
```

**Serviços Effect:**
- `makeRuntime` — para serviços compartilhados
- `InstanceState` — estado por diretório/projeto
- `ScopedCache` — cache com cleanup automático

---

## Resumo

| Aspecto | Detalhe |
|---------|---------|
| **O que é** | CLI de IA para RE e Pentest |
| **Base** | Fork do opencode v11 |
| **Agentes** | 18 especializados (8 RE + 10 Pentest) |
| **Runtime** | Bun |
| **UI** | Terminal (SolidJS) + Web |
| **Banco** | SQLite via Drizzle |
| **Deploy** | npm (CLI) + Vercel (site) |
| **Modo** | Unrestricted (sem restrições) |
| **Status** | v1.2.6 (ativo) |
