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
python generate.py --install    # ...and copy them into the game (src/voice/en/)
python generate.py --force      # record them all again (e.g. after changing the voice)
python generate.py --limit 5    # just the first 5
python generate.py --part 1/2   # half the list; run --part 2/2 in a second window at the same time
```

The whole list is about 2,900 sentences. It takes 1–2 hours on a laptop CPU, and the result is about 18 MB of MP3s. Sentences already recorded are skipped, so a run can be stopped and started again.

The **first line** of `sentences_english.txt` chooses the voice:

```
VOICE=af_heart SPEED=0.9 LANG=a  # ...why...
```

- `af_heart`, the default, is Kokoro's warmest and clearest voice: American English, female, friendly and calm. That makes it the best fit for young children.
- Other voices worth trying: `af_bella`, `af_nicole`, `bf_emma` (British) and `am_michael` (male).
- `SPEED=0.9` is a little slower than normal, for young listeners.
- `LANG=a` is American English; use `b` for British English.

## Put the recordings in the game

Run `python generate.py --install`. It copies the recording of every sentence in the list into `src/voice/en/`, where the game finds them by file name, and removes recordings whose sentence is no longer in the list. Then run the game (`npm run dev`): those sentences use the recording.

Tested: with the two sample sentences copied in, the "Who's playing?" screen played both recordings instead of the device voice.

## The sentence list

`sentences_english.txt` is made by the game: run `npm run voice:lines -- en --txt` in the game's folder after changing any spoken text. It keeps line 1 (your voice settings). Then run `generate.py --install` to record the new sentences.

The list holds every sentence the game says to a child:
- the spoken lines of the menus and games;
- every game phrase with each of its numbers and characters;
- the questions of the ages 3-6 skills;
- the numbers 0-20.

To keep it small, spoken lines have no names, and choices and numbers are read as short sentences of their own, so one recording serves many questions. See "Record the voice" in `ARCHITECTURE.md`.

Kokoro has no Hebrew voice, so Hebrew will need a different engine when it comes. The game side already supports it: recordings go in `src/voice/he/`.
