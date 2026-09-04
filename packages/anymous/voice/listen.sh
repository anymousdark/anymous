#!/usr/bin/env bash
# Any voice - listen (grava do mic e transcreve)
# Uso: listen.sh [segundos]  (1-30, default 5)
set -u
VOICE_DIR="$HOME/.local/share/anymous/voice"
SECS="${1:-5}"
[[ "$SECS" =~ ^[0-9]+$ ]] && [ "$SECS" -gt 0 ] && [ "$SECS" -le 30 ] || SECS=5
[ -x "$VOICE_DIR/venv/bin/python" ] || { echo "venv python em falta" >&2; exit 1; }
[ -f "$VOICE_DIR/listen.py" ] || { echo "listen.py em falta" >&2; exit 1; }
rm -f /tmp/any-listen.wav
if command -v pw-record >/dev/null 2>&1; then
  timeout "$((SECS + 2))" pw-record --rate 16000 --channels 1 /tmp/any-listen.wav 2>/dev/null &
  REC_PID=$!
  sleep "$SECS"
  kill -INT "$REC_PID" 2>/dev/null
  wait "$REC_PID" 2>/dev/null
else
  arecord -D default -f S16_LE -r 16000 -c 1 -d "$SECS" /tmp/any-listen.wav 2>/dev/null || { echo "gravacao falhou" >&2; exit 1; }
fi
[ -s /tmp/any-listen.wav ] || { echo "audio vazio" >&2; exit 1; }
"$VOICE_DIR/venv/bin/python" "$VOICE_DIR/listen.py" /tmp/any-listen.wav
