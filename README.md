# TitleBuzz

![Logo](icons/icon.png)

**TitleBuzz** is a local, open-source Whisper-powered transcription panel for **Adobe Premiere Pro 2023 (23.x)**.

> **Note:** This is an open source project. All contributions, feedback, and improvements are welcome.

Publisher: **Turbo Studios**  
License: **MIT**

## What is included

- Model selector: tiny, base, small, medium, large-v3
- Language selector with Auto Detect
- Audio/video file picker
- Local Python Whisper processing
- Timestamped transcript segments
- Copy transcript
- Save TXT
- Save SRT for importing into Premiere Pro
- Python executable path selector
- Cancel button
- Friendly error/status UI

## Supported language 
- Bangla
- English
- Hindi
- Urdu
- Arabic
- Spanish
- French
- German
- Italian
- Japanese
- Korean
- Portuguese
- Russian
- Chinese
- Esperanto

## 1. Install Python dependencies

Use a supported Python installation and run:

```bash
python -m pip install -r requirements.txt
```

Whisper also requires **FFmpeg** for decoding common audio/video formats. Make sure the `ffmpeg` command is available in the system PATH.

For a first test, use the `base` model. Larger models require substantially more RAM/CPU time.

## 2. Install the CEP extension

Copy the complete `TitleBuzz` folder into the Premiere CEP extensions directory.

Windows commonly uses:

```text
%APPDATA%/Adobe/CEP/extensions/
```

For development, enable unsigned CEP extensions using the appropriate CEP PlayerDebugMode registry setting for the CEP version installed by your Adobe apps.

Then restart Premiere Pro.

Open:

```text
Window > Extensions > TitleBuzz
```

## 3. First run

1. Choose a media file.
2. Choose a Whisper model.
3. Choose a language or Auto Detect.
4. Confirm the Python path. Usually `python` is enough.
5. Click **Transcribe**.
6. Use **Save SRT** if you want timestamped subtitles/captions.

## Accuracy notes

No speech-to-text system can guarantee 100% perfect transcription. Whisper accuracy depends on audio quality, accents, overlapping speakers, background noise, and language. `large-v3` generally gives the best Whisper quality but is much heavier than `base` or `small`.

TitleBuzz intentionally uses `fp16=False` so CPU-only machines can run the backend without CUDA.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! If you find bugs, have feature requests, or want to improve TitleBuzz:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Architecture

```text
Premiere Pro 2023
       |
       v
CEP HTML/CSS/JS panel
       |
       | Node child_process
       v
backend.py
       |
       v
OpenAI Whisper
       |
       v
TXT / SRT / transcript UI
```

## Support

For issues, questions, or feature requests, please open an issue on the project repository.

## Disclaimer

TitleBuzz is provided as-is. While it processes media locally and does not send data to external servers, always verify transcription output, especially for critical applications. No warranty is provided.

---

**Version:** 1.0.0  
**Last Updated:** August 2026

The panel does not upload the media to a cloud transcription service; the Whisper inference is performed locally by the Python environment.
