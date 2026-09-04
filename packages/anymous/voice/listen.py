#!/usr/bin/env python3
"""Any voice - listen (STT via faster-whisper, tiny model, pt)."""
import os
import sys

audio = sys.argv[1] if len(sys.argv) > 1 else "/tmp/any-listen.wav"
if not os.path.isfile(audio) or os.path.getsize(audio) < 4096:
    print("audio invalido", file=sys.stderr)
    sys.exit(2)

from faster_whisper import WhisperModel

model = WhisperModel("tiny", device="cpu", compute_type="int8")
segments, _ = model.transcribe(
    audio,
    language="pt",
    beam_size=5,
    vad_filter=True,
    condition_on_previous_text=False,
    no_speech_threshold=0.6,
)
text = " ".join(s.text.strip() for s in segments).strip()
print(text)
