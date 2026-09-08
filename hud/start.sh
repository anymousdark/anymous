#!/usr/bin/env bash
# Sobe o hub do Any: anymous serve (:4096) + backend (:4123)
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.bun/bin:$PATH"
export OPENCODE_API_KEY="${OPENCODE_API_KEY:-sk-ugirbdBzp3Crj4fmVXtiBrkXwKQp2xnZ5aw1V2gTORau5f9ZShMdcij9XCTPbJhU}"

pkill -f "anymous.*--port 4096" 2>/dev/null
if [ -x "$ROOT/packages/anymous/dist/anymous-linux-x64/bin/anymous" ]; then
  ANY_CMD="exec '$ROOT/packages/anymous/dist/anymous-linux-x64/bin/anymous' web --port 4096"
else
  ANY_CMD="exec ~/.bun/bin/bun run --conditions=browser ./src/index.ts web --port 4096"
fi
setsid nohup bash -c "cd '$ROOT/packages/anymous' && $ANY_CMD" > /tmp/opencode/anymous-web.log 2>&1 < /dev/null &
setsid nohup bash -c "cd '$ROOT/any-interface/backend' && exec ~/.bun/bin/bun run src/index.ts" > /tmp/opencode/any-ui.log 2>&1 < /dev/null &
sleep 10
echo "anymous: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4096/)"
echo "hub:     $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4123/)"
echo "Abre: http://127.0.0.1:4123/"
