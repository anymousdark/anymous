#!/usr/bin/env bash
# Any daemon — sempre ligado: espera "hey jarvis" -> 1 turno de voz -> volta a ouvir
# Uso: anyd.sh [start|stop|status]
# Requer: venv (openwakeword+faster-whisper), piper, mic
set -u
VOICE_DIR="$HOME/.local/share/anymous/voice"
PIDFILE="/tmp/anyd.pid"
ANYMOUS_BIN="$HOME/.bun/bin/anymous"

wake_once() {
  "$VOICE_DIR/venv/bin/python" "$VOICE_DIR/wake.py"
}

case "${1:-start}" in
  start)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      echo "anyd já corre (pid $(cat "$PIDFILE"))"
      exit 0
    fi
    echo $$ > "$PIDFILE"
    echo "anyd ligado — diz 'hey jarvis'. Ctrl+C para parar."
    while true; do
      wake_once 2>/dev/null || break
      echo "🔔 acordou! fala agora"
      "$ANYMOUS_BIN" voice --listen 8 --agent any 2>/dev/null || true
      sleep 1
    done
    rm -f "$PIDFILE"
    ;;
  stop)
    [ -f "$PIDFILE" ] && kill "$(cat "$PIDFILE")" 2>/dev/null
    pkill -f "voice/wake.py" 2>/dev/null
    rm -f "$PIDFILE"
    echo "anyd parado"
    ;;
  status)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      echo "anyd a correr (pid $(cat "$PIDFILE"))"
    else
      echo "anyd parado"
    fi
    ;;
esac
