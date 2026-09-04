#!/usr/bin/env python3
"""Any voice - listen (STT via faster-whisper, tiny model, pt)."""
import sys
from faster_whisper import WhisperModel

audio = sys.argv[1] if len(sys.argv) > 1 else "/tmp/any-listen.wav"
model = WhisperModel("tiny", device="cpu", compute_type="int8")
segments, _ = model.transcribe(audio, language="pt", beam_size=1)
text = " ".join(s.text.strip() for s in segments).strip()
print(text)
