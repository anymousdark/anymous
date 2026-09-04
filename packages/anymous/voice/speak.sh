#!/usr/bin/env bash
# Any voice - speak (TTS pt-BR via Piper)
# Uso: speak.sh "texto para falar"
VOICE_DIR="$HOME/.local/share/anymous/voice"
TEXT="${*:-Olá, eu sou o Any.}"
echo "$TEXT" | "$VOICE_DIR/bin/piper" --model "$VOICE_DIR/pt_BR-faber-medium.onnx" --output_file /tmp/any-speak.wav 2>/dev/null && aplay /tmp/any-speak.wav 2>/dev/null
