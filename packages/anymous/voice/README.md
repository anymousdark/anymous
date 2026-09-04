# Any Voice — falar e ouvir (pt-BR, offline)

Voz do orquestrador Any. 100% local, sem API.

## Requisitos

- `arecord` + `aplay` (alsa-utils)
- Piper TTS: https://github.com/rhasspy/piper/releases (`piper_linux_x86_64.tar.gz`)
- Voz pt-BR: `pt_BR-faber-medium.onnx` (+ `.json`) de https://huggingface.co/rhasspy/piper-voices
  (`pt/pt_BR/faber/medium/`)
- Python venv com `faster-whisper` (modelo `tiny`, ~75MB, baixa sozinho no 1º uso)

Layout esperado em `~/.local/share/anymous/voice/`:

```
voice/
  bin/piper (+ libs)
  pt_BR-faber-medium.onnx
  pt_BR-faber-medium.onnx.json
  venv/ (faster-whisper)
  speak.sh listen.sh listen.py
```

## Uso

```bash
# Falar
~/.local/share/anymous/voice/speak.sh "Olá, eu sou o Any."

# Ouvir (grava 5s do mic e transcreve)
~/.local/share/anymous/voice/listen.sh 5

# Loop manual voz -> Any -> voz
TEXTO=$(~/.local/share/anymous/voice/listen.sh 5)
RESPOSTA=$(anymous run --agent any "$TEXTO")
~/.local/share/anymous/voice/speak.sh "$RESPOSTA"
```

## Notas

- STT usa modelo `tiny` (rápido, ~1GB RAM). Para mais precisão troque para `base` em `listen.py`.
- Gravacão: 16kHz mono. Sem mic o ficheiro sai curto e a transcrição vem vazia.
