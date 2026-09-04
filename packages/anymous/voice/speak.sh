#!/usr/bin/env bash
# Any voice - speak (TTS pt-BR via Piper)
# Uso: speak.sh [--no-play] "texto para falar"
# Env: ANY_VOICE_RATE (default 1.25, maior = mais lento)
set -u
VOICE_DIR="$HOME/.local/share/anymous/voice"
NO_PLAY=""
if [ "${1:-}" = "--no-play" ]; then NO_PLAY=1; shift; fi
RATE="${ANY_VOICE_RATE:-1.25}"
[[ "$RATE" =~ ^[0-9]+(\.[0-9]+)?$ ]] || RATE=1.25
TEXT="$*"
[ -z "$TEXT" ] && exit 0
[ -x "$VOICE_DIR/bin/piper" ] || { echo "piper em falta" >&2; exit 1; }
[ -f "$VOICE_DIR/pt_BR-faber-medium.onnx" ] || { echo "voz em falta" >&2; exit 1; }
rm -f /tmp/any-speak.wav
printf '%s' "$TEXT" | "$VOICE_DIR/bin/piper" --model "$VOICE_DIR/pt_BR-faber-medium.onnx" --length-scale "$RATE" --output_file /tmp/any-speak.wav 2>/dev/null || { echo "piper falhou" >&2; exit 1; }
[ -s /tmp/any-speak.wav ] || { echo "wav vazio" >&2; exit 1; }
if [ -z "$NO_PLAY" ]; then
  if command -v pw-play >/dev/null 2>&1; then
    pw-play /tmp/any-speak.wav 2>/dev/null
  else
    aplay /tmp/any-speak.wav 2>/dev/null
  fi
fi
