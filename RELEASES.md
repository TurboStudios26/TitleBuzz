# TitleBuzz Release Notes

## Version 1.0.0 — August 2026

### 🎉 Initial Release

**TitleBuzz** v1.0.0 is the first official public release of this open-source Whisper transcription panel for Adobe Premiere Pro.

### ✨ Features

- **Local Transcription** — Uses OpenAI Whisper for accurate, private speech-to-text processing on your machine
- **Multiple Models** — Support for tiny, base, small, medium, and large-v3 Whisper models
- **Language Detection** — Auto-detect or manually select from 99+ languages
- **Media Support** — Transcribe from MP3, WAV, M4A, AAC, FLAC, OGG, WMA, MP4, MOV, MKV, AVI, WebM, M4V
- **Multiple Export Formats**:
  - **TXT** — Plain text transcripts
  - **SRT** — Timestamped subtitle format (import directly into Premiere Pro)
  - **Copy to Clipboard** — Quick copy for pasting into documents
- **Timestamped Segments** — Track exact timing for each transcribed segment
- **Flexible Python Configuration** — Select Python executable path for custom environments
- **Cancel Support** — Stop transcription at any time
- **User-Friendly UI** — Real-time status updates and progress tracking
- **CPU-Optimized** — `fp16=False` for CPU-only systems (no CUDA required)

### 📦 Requirements

- **Adobe Premiere Pro** 2023 (23.x)
- **Python 3.8+** with pip
- **FFmpeg** (for audio/video decoding)
- **Dependencies** (see `requirements.txt`):
  - openai-whisper
  - pydub

### 🚀 What's New in 1.0.0

- ✅ Initial open-source release
- ✅ Full CEP extension for Premiere Pro 2023
- ✅ Local Python backend for transcription
- ✅ Support for Whisper model variants
- ✅ SRT export for subtitle workflows
- ✅ Comprehensive error handling
- ✅ MIT License

### 🔧 Installation

1. Install Python dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```

2. Install FFmpeg and ensure it's in your system PATH

3. Copy the complete `TitleBuzz` folder to:
   ```
   %APPDATA%/Adobe/CEP/extensions/
   ```

4. Enable unsigned CEP extensions (development mode) if needed

5. Restart Adobe Premiere Pro

6. Open: **Window > Extensions > TitleBuzz**

### ⚠️ Known Issues

- First run of large models (medium, large-v3) may take several minutes for initial download
- Transcription quality depends heavily on audio quality and background noise
- Very long media files (2+ hours) may consume significant memory
- CEP requires unsigned extension debugging mode for initial installation

### 📋 Tested On

- Windows 10/11 with Python 3.10+
- Adobe Premiere Pro 2023.6+

### 🙏 Acknowledgments

Built with [OpenAI Whisper](https://github.com/openai/whisper) and Adobe CEP framework.

### 📄 License

MIT License — See LICENSE file for details

### 🔗 Resources

- [GitHub Repository](https://github.com/turbostudios26/titlebuzz)
- [OpenAI Whisper](https://github.com/openai/whisper)

---

**Publisher:** Turbo Studios  
**Release Date:** August 13, 2026
