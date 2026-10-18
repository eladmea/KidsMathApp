# Voice generator

Records the game's sentences with **[Kokoro](https://huggingface.co/hexgrad/Kokoro-82M)**, a free AI voice that runs on your own computer, through [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx). It's the same voices without PyTorch, so the install is about 100 MB instead of several GB. The game then plays these recordings instead of the device's robotic text-to-speech. Any sentence without a recording still uses the device voice, so recordings can be added a few at a time.

This folder is separate from the game: nothing in it is built into the app. Only the finished `.mp3` files are copied into the game, into `src/voice/en/`. The Python packages and the Kokoro model files stay on your computer. The model files are downloaded into `models/` on the first run: `kokoro-v1.0.onnx` (325 MB) and `voices-v1.0.bin` (28 MB).

## Files

| File | What it is |
|---|---|
| `generate.py` | The script |
| `sentences_english.txt` | Line 1: the voice settings. Then one sentence per line, as `file name \| sentence` |
| `voices_export/` | The recordings it makes (not committed to git) |
| `models/` | The Kokoro model, downloaded on the first run (not committed to git) |

## Set up (once)

You need **Python 3.10 or newer**, and preferably **ffmpeg**. ffmpeg makes small MP3 files, about 6 KB a sentence; without it you get WAV files, about 8× bigger.

```bash
cd voice-generator
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Install ffmpeg: Mac `brew install ffmpeg`, Windows `winget install ffmpeg`, Linux `sudo apt install ffmpeg`.

## Run

```bash
python generate.py --samples    # the first sentence in 8 voices: voices_export/_samples/
python generate.py              # every sentence that has no recording yet
python generate.py --force      # record them all again (e.g. after changing the voice)
python generate.py --limit 5    # just the first 5
```

The **first line** of `sentences_english.txt` chooses the voice:

```
VOICE=af_heart SPEED=0.9 LANG=a  # ...why...
```

- `af_heart`, the default, is Kokoro's warmest and clearest voice: American English, female, friendly and calm. That makes it the best fit for young children.
- Other voices worth trying: `af_bella`, `af_nicole`, `bf_emma` (British) and `am_michael` (male).
- `SPEED=0.9` is a little slower than normal, for young listeners.
- `LANG=a` is American English; use `b` for British English.

## Put the recordings in the game

Copy the `.mp3` files from `voices_export/` into `src/voice/en/`. Each file is named after its sentence's id, which is how the game finds it. Then run the game (`npm run dev`): those sentences now use the recording.

Tested: with the two sample sentences copied in, the "Who's playing?" screen played both recordings instead of the device voice.

## The sentence list

Every sentence the game can say is listed with its file name by `npm run voice:lines -- en` in the game's folder. That list will fill `sentences_english.txt` (step 2 of the plan).

Kokoro has no Hebrew voice, so Hebrew will need a different engine when it comes. The game side already supports it: recordings go in `src/voice/he/`.
