#!/usr/bin/env bash
# Any voice - listen (grava 5s do mic e transcreve)
# Uso: listen.sh [segundos]
VOICE_DIR="$HOME/.local/share/anymous/voice"
SECS="${1:-5}"
if command -v pw-record >/dev/null 2>&1; then
  timeout "$((SECS + 2))" pw-record --rate 16000 --channels 1 /tmp/any-listen.wav 2>/dev/null &
  REC_PID=$!
  sleep "$SECS"
  kill -INT "$REC_PID" 2>/dev/null
  wait "$REC_PID" 2>/dev/null
else
  arecord -D default -f S16_LE -r 16000 -c 1 -d "$SECS" /tmp/any-listen.wav 2>/dev/null
fi
"$VOICE_DIR/venv/bin/python" "$VOICE_DIR/listen.py" /tmp/any-listen.wav
