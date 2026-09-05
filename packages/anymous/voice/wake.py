#!/usr/bin/env python3
"""Any wake word — ouve 'hey jarvis' (openwakeword) e dispara comando.
Uso: wake.py [comando...]  (default: imprime WAKE e sai)
Para 'hey any' personalizado é preciso treinar modelo próprio (ver README).
"""
import os
import subprocess
import sys

import numpy as np
from openwakeword.model import Model

WORD = "hey_jarvis"
THRESHOLD = 0.5
RATE = 16000
CHUNK = 1280  # 80ms @16kHz

import glob

paths = glob.glob(
    os.path.expanduser("~/.local/share/anymous/voice/venv/lib/python*/site-packages/openwakeword/resources/models/hey_jarvis*.onnx")
) or glob.glob("/home/aycher/.local/share/anymous/voice/venv/lib/python*/site-packages/openwakeword/resources/models/hey_jarvis*.onnx")
model = Model(wakeword_model_paths=paths)
print(f"a ouvir '{WORD}'... (Ctrl+C sai)", flush=True)

arecord = subprocess.Popen(
    ["arecord", "-D", "default", "-f", "S16_LE", "-r", str(RATE), "-c", "1", "-t", "raw"],
    stdout=subprocess.PIPE,
    stderr=subprocess.DEVNULL,
)
try:
    while True:
        data = arecord.stdout.read(CHUNK * 2)
        if len(data) < CHUNK * 2:
            break
        frame = np.frombuffer(data, dtype=np.int16)
        score = model.predict(frame).get(WORD, 0)
        if score >= THRESHOLD:
            print("WAKE!", flush=True)
            model.reset()
            if len(sys.argv) > 1:
                subprocess.run(sys.argv[1:])
            else:
                break
except KeyboardInterrupt:
    pass
finally:
    arecord.terminate()
