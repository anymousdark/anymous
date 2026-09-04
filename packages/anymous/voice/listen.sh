#!/usr/bin/env bash
# Any voice - listen (grava 5s do mic e transcreve)
# Uso: listen.sh [segundos]
VOICE_DIR="$HOME/.local/share/anymous/voice"
SECS="${1:-5}"
arecord -D default -f S16_LE -r 16000 -c 1 -d "$SECS" /tmp/any-listen.wav 2>/dev/null
"$VOICE_DIR/venv/bin/python" "$VOICE_DIR/listen.py" /tmp/any-listen.wav
