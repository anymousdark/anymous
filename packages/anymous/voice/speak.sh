#!/usr/bin/env bash
# Any voice - speak (TTS pt-BR via Piper)
# Uso: speak.sh "texto para falar"
VOICE_DIR="$HOME/.local/share/anymous/voice"
TEXT="${*:-Olá, eu sou o Any.}"
RATE="${ANY_VOICE_RATE:-1.25}"
echo "$TEXT" | "$VOICE_DIR/bin/piper" --model "$VOICE_DIR/pt_BR-faber-medium.onnx" --length-scale "$RATE" --output_file /tmp/any-speak.wav 2>/dev/null
if command -v pw-play >/dev/null 2>&1; then
  pw-play /tmp/any-speak.wav 2>/dev/null
else
  aplay /tmp/any-speak.wav 2>/dev/null
fi
