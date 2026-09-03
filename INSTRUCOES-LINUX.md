# Anymous Desktop — Instruções de Build para Linux (.deb)

Este guia explica como compilar o **anymous desktop** (GUI Electron) para Linux e gerar o pacote `.deb` para distribuição via GitHub Releases.

---

## Pré-requisitos

```bash
# Debian/Ubuntu
sudo apt update
sudo apt install -y build-essential git curl zip unzip \
  libgtk-3-dev libnotify-dev libnss3-dev libxss-dev \
  libasound2-dev libxtst-dev libatspi2.0-dev libdrm-dev \
  pkg-config rpm

# Bun (se ainda não tiver)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Node.js 20+ (necessário para electron-vite)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## Passo 1 — Clonar o repositório

```bash
git clone https://github.com/anymousdark/anymous.git
cd anymous
git checkout test-tiny  # ou a branch que você estiver usando
```

---

## Passo 2 — Instalar dependências

```bash
bun install
```

---

## Passo 3 — Gerar modelos (models data)

```bash
cd packages/anymous
bun run script/generate.ts
cd ../..
```

---

## Passo 4 — Compilar o binário CLI Linux

```bash
cd packages/anymous

# Build para linux-x64 (esta máquina)
ANYMOUS_VERSION=1.3.11 ANYMOUS_CHANNEL=latest \
  bun run script/build.ts --single --skip-install

# O binário fica em: dist/anymous-linux-x64/bin/anymous
cd ../..
```

**Verificar o binário:**
```bash
./packages/anymous/dist/anymous-linux-x64/bin/anymous --version
# Deve imprimir: 1.3.11
```

---

## Passo 5 — Compilar a Web UI

```bash
cd packages/app
bun install
bun run build
cd ../..
```

---

## Passo 6 — Compilar o Desktop Electron

```bash
cd packages/desktop

# Instalar dependências do desktop
bun install

# Build do Electron (compila TypeScript + Vite)
bun run build

# Gerar pacotes Linux (.deb, .rpm, .AppImage)
ANYMOUS_CHANNEL=prod bun run package:linux

# Os pacotes ficam em: packages/desktop/dist/
ls -la dist/*.deb dist/*.rpm dist/*.AppImage
cd ../..
```

---

## Passo 7 — Verificar o .deb

```bash
# Verificar conteúdo do pacote
dpkg-deb --contents packages/desktop/dist/anymous-desktop-linux-x64.deb

# Testar instalação local
sudo dpkg -i packages/desktop/dist/anymous-desktop-linux-x64.deb
sudo apt-get install -f  # resolve dependências

# Rodar
anymous-desktop
# ou
ai.anymous.desktop
```

---

## Passo 8 — Criar release no GitHub

```bash
# Criar release (se ainda não existe)
gh release create v1.3.11 \
  --repo anymousdark/anymous \
  --title "v1.3.11 — Desktop Linux" \
  --notes "anymous Desktop v1.3.11 para Linux (GUI Electron)"

# Upload dos pacotes
gh release upload v1.3.11 \
  --repo anymousdark/anymous \
  packages/desktop/dist/anymous-desktop-linux-x64.deb \
  packages/desktop/dist/anymous-desktop-linux-x64.AppImage \
  packages/desktop/dist/anymous-desktop-linux-x64.rpm
```

---

## Passo 9 — Publicar binário CLI Linux no npm

```bash
cd packages/anymous/dist/anymous-linux-x64

# Empacotar
bun pm pack

# Publicar
npm publish ./anymous-linux-x64-1.3.11.tgz --access public --tag latest

cd ../../..
```

---

## Estrutura de diretórios esperada

```
anymous/
├── packages/
│   ├── anymous/          # CLI (gera binário + pacote npm)
│   │   ├── script/
│   │   │   ├── build.ts        # Compila binário por plataforma
│   │   │   ├── generate.ts     # Gera models data
│   │   │   ├── prepare-npm.ts  # Monta wrapper npm
│   │   │   └── publish.ts      # Publica npm + Docker + Homebrew
│   │   └── dist/
│   │       └── anymous-linux-x64/
│   │           └── bin/anymous   # Binário compilado
│   ├── app/              # Web UI (SolidJS + Vite)
│   │   ├── src/
│   │   └── dist/         # Build da web UI
│   └── desktop/          # App Electron
│       ├── src/main/
│       │   ├── index.ts        # Entry point Electron
│       │   ├── server.ts       # Spawna CLI como sidecar
│       │   └── sidecar.ts      # Sidecar process
│       ├── electron-builder.config.ts
│       └── dist/         # Pacotes gerados (.deb, .rpm, .AppImage)
└── site/                 # Landing page (Vercel)
```

---

## Notas importantes

### Branding
O arquivo `.desktop` em `packages/desktop/resources/linux/anymous-desktop.desktop`
ainda diz "OpenCode". Antes do build, edite para:
```ini
[Desktop Entry]
Name=Anymous
Exec=/opt/anymous/ai.anymous.desktop %U
Terminal=false
Type=Application
Icon=ai.anymous.desktop
StartupWMClass=ai.anymous.desktop
Comment=Anymous - AI Reverse Engineering & Pentest Platform
Categories=Development;
```

### Variáveis de ambiente do build
| Variável | Valor | Descrição |
|----------|-------|-----------|
| `ANYMOUS_VERSION` | `1.3.11` | Versão do build |
| `ANYMOUS_CHANNEL` | `prod` | Canal (dev/beta/prod) |
| `GH_REPO` | `anymousdark/anymous` | Repo para upload de release |

### App IDs por canal
| Canal | App ID |
|-------|--------|
| dev | `ai.anymous.desktop.dev` |
| beta | `ai.anymous.desktop.beta` |
| prod | `ai.anymous.desktop` |

### Tamanho esperado do .deb
- ~150-200 MB (Electron + Web UI + binário CLI)

---

## Checklist de release

- [ ] Binário CLI compilado e testado (`anymous --version`)
- [ ] Web UI compilada (`packages/app/dist/`)
- [ ] Desktop Electron compilado
- [ ] Pacotes gerados: `.deb`, `.rpm`, `.AppImage`
- [ ] `.desktop` file rebrandado para Anymous
- [ ] Release criado no GitHub com todos os pacotes
- [ ] npm publicado (binário Linux + wrapper)
- [ ] Site atualizado com link de download Linux
