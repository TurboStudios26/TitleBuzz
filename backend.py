#!/usr/bin/env python3
"""
TitleBuzz - local Whisper backend
Publisher: Turbo Studios

Protocol:
  stdin  -> one JSON object per line
  stdout -> one JSON object per line
"""

import json
import os
import sys
import traceback
from pathlib import Path

try:
    import whisper
except Exception as exc:
    whisper = None
    IMPORT_ERROR = exc
else:
    IMPORT_ERROR = None

MODELS = {
    "tiny": "tiny",
    "base": "base",
    "small": "small",
    "medium": "medium",
    "large-v3": "large-v3",
}

LANGUAGES = {
    "bn": "Bangla",
    "en": "English",
    "hi": "Hindi",
    "ur": "Urdu",
    "ar": "Arabic",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "ja": "Japanese",
    "ko": "Korean",
    "pt": "Portuguese",
    "ru": "Russian",
    "zh": "Chinese",
    "eo": "Esperanto",
}

_loaded_models = {}
_cancel_requested = False


def emit(obj):
    sys.stdout.write(json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def status(message, progress=None):
    data = {"type": "status", "message": message}
    if progress is not None:
        data["progress"] = progress
    emit(data)


def clean_text(text):
    return (text or "").replace("\r\n", "\n").replace("\r", "\n").strip()


def load_model(name):
    if name not in MODELS:
        raise ValueError("Unsupported Whisper model: " + str(name))

    if name in _loaded_models:
        return _loaded_models[name]

    status("Loading Whisper model: " + name + " ...", 8)
    model = whisper.load_model(MODELS[name])
    _loaded_models[name] = model
    return model


def transcribe(request):
    global _cancel_requested
    _cancel_requested = False

    if whisper is None:
        raise RuntimeError(
            "Whisper is not installed in this Python environment.\n"
            "Run: python -m pip install -r requirements.txt"
            "\n\nImport error: " + repr(IMPORT_ERROR)
        )

    audio_path = str(request.get("audio_path") or "").strip()
    model_name = str(request.get("model") or "base")
    language = request.get("language") or None

    if not audio_path:
        raise ValueError("No media file was provided.")

    file_path = Path(audio_path)
    if not file_path.is_file():
        raise FileNotFoundError("Media file not found:\n" + audio_path)

    if language and language not in LANGUAGES:
        raise ValueError("Unsupported language code: " + str(language))

    # FFmpeg is used by openai-whisper to decode most common media formats.
    status("Preparing audio...", 12)
    model = load_model(model_name)

    if _cancel_requested:
        emit({"type": "cancelled"})
        return

    status("Transcribing with " + model_name + " ...", 20)

    # fp16=False is intentional: it works reliably on CPU-only systems.
    result = model.transcribe(
        str(file_path),
        language=language,
        task="transcribe",
        fp16=False,
        temperature=0,
        condition_on_previous_text=True,
        verbose=False,
    )

    if _cancel_requested:
        emit({"type": "cancelled"})
        return

    text = clean_text(result.get("text", ""))
    segments = []

    for seg in result.get("segments", []) or []:
        segments.append({
            "id": int(seg.get("id", len(segments))),
            "start": float(seg.get("start", 0.0)),
            "end": float(seg.get("end", 0.0)),
            "text": clean_text(seg.get("text", "")),
        })

    detected = result.get("language") or language or ""
    detected_name = LANGUAGES.get(detected, detected)

    emit({
        "type": "result",
        "text": text,
        "language": detected_name,
        "language_code": detected,
        "segments": segments,
        "model": model_name,
    })


def main():
    status("TitleBuzz Python engine ready.", 0)

    for raw in sys.stdin:
        raw = raw.strip()
        if not raw:
            continue

        try:
            request = json.loads(raw)
            command = request.get("cmd")

            if command == "transcribe":
                transcribe(request)
            elif command == "cancel":
                global _cancel_requested
                _cancel_requested = True
                emit({"type": "status", "message": "Cancellation requested.", "progress": 0})
            elif command == "ping":
                emit({"type": "pong"})
            else:
                emit({"type": "error", "message": "Unknown command: " + str(command)})

        except KeyboardInterrupt:
            break
        except Exception as exc:
            message = str(exc).strip() or exc.__class__.__name__
            emit({
                "type": "error",
                "message": message,
                "details": traceback.format_exc(limit=4),
            })


if __name__ == "__main__":
    main()
