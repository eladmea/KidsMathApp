# Voice generator

Records the game's sentences with **[Kokoro](https://huggingface.co/hexgrad/Kokoro-82M)**, a free AI voice that runs on your own computer, through [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx). It's the same voices without PyTorch, so the install is about 100 MB instead of several GB. The game then plays these recordings instead of the device's robotic text-to-speech. Any sentence without a recording still uses the device voice, so recordings can be added a few at a time. Hebrew is recorded with Google's Gemini instead (see "Hebrew").

This folder is separate from the game: nothing in it is built into the app. Only the finished `.mp3` files are copied into the game, into `src/voice/en/`. The Python packages and the Kokoro model files stay on your computer. The model files are downloaded into `models/` on the first run: `kokoro-v1.0.onnx` (325 MB) and `voices-v1.0.bin` (28 MB).

## Files

| File | What it is |
|---|---|
| `generate.py` | The script |
| `sentences_english.txt` | Line 1: the voice settings. Then one sentence per line, as `file name \| sentence` |
| `sentences_hebrew.txt` | The same for Hebrew (see "Hebrew" below) |
| `voices_export/` | The recordings it makes (not committed to git). English goes in the folder itself, Hebrew in `voices_export/he/`: a sentence with no words ("7", "3 + 4") has the same file name in both |
| `models/` | The Kokoro model, downloaded on the first run (not committed to git) |

## Set up (once)

You need **Python 3.12 or newer** (Hebrew's `renikud-onnx` won't install on older ones; on a PC with only an older Python, `pip install uv` and `python -m uv python install 3.12` fetch one, then make the `.venv` with it), and preferably **ffmpeg**. ffmpeg makes small MP3 files, about 7 KB a sentence; without it you get WAV files, about 8× bigger.

```bash
cd voice-generator
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Install ffmpeg: Mac `brew install ffmpeg`, Windows `winget install ffmpeg`, Linux `sudo apt install ffmpeg`.

## Run

On Windows, set `PYTHONIOENCODING=utf-8` first, so Hebrew sentences print instead of stopping the run.

```bash
python generate.py --samples    # the first sentence in 8 voices: voices_export/_samples/
python generate.py              # every sentence that has no recording yet
python generate.py --install    # ...and copy them into the game (src/voice/en/)
python generate.py --force      # record them all again (e.g. after changing the voice)
python generate.py --limit 5    # just the first 5
python generate.py --part 1/2   # half the list; run --part 2/2 in a second window at the same time
```

The whole list is about 3,400 sentences. It takes 1–2 hours on a laptop CPU, and the result is about 22 MB of MP3s. Sentences already recorded are skipped, so a run can be stopped and started again.

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

To keep it small, spoken lines have no names, and choices and numbers are read as short sentences of their own, so one recording serves many questions. Sentences that differ only by punctuation, capital letters or digits vs number words ("Cat." and "cat!", "5" and "Five!") are listed once and share one recording, because the voice says them the same way. See "Record the voice" in `ARCHITECTURE.md`.

A sentence already in the game's voice folder counts as recorded, even if `voices_export/` has no copy (or has it under an older file name), and `--install` keeps it.

## Hebrew

`sentences_hebrew.txt` holds the Hebrew sentences (made with `npm run voice:lines -- he --txt`). Its line 1 picks the Hebrew engine:

```
ENGINE=gemini VOICE=Erinome MODEL=gemini-3.8-flash-tts
```

### Gemini (the Hebrew voice in the game)

Hebrew is recorded with Google's [Gemini text-to-speech](https://ai.google.dev/gemini-api/docs/speech-generation), voice **Erinome**: a clear, precise female voice. It was chosen by ear over Kore, Sulafat and Vindemiatrix on the game's welcome line. Gemini is a paid service, and its recordings may be used in a game that is sold. The old free voice (Kokoro Hebrew, below) may not.

```bash
# Windows: set GEMINI_API_KEY (Google AI Studio → Get API key, with billing on) and PYTHONIOENCODING=utf-8
python generate.py --file sentences_hebrew.txt --samples              # the first sentence in 6 female voices
python generate.py --file sentences_hebrew.txt --install              # new sentences only, then copy into src/voice/he/
python generate.py --file sentences_hebrew.txt --fresh --install      # every sentence again (a new voice)
```

- **How each sentence is said.** `gemini_tts.py` sends every sentence with a short style note, which shapes the voice and is never spoken. All of them start "A kind kindergarten teacher talking to a young child, clear and unhurried", then add one of:
  - praise ("כל הכבוד", "הצלחתם!", all answers right): excited and proud;
  - a miss ("לא כאן", "כמעט", fewer than half right): gentle and encouraging;
  - a question: curious and playful;
  - one or two words (letter names, words to read): slow and very clear;
  - other lines ending in "!": cheerful; everything else: warm and friendly.
  
  `_styles.tsv` in `voices_export/he/` lists what each sentence got.
- **Breaths and pauses.** A sentence of 14 words or more starts with `<breath>`, and one of 10 words or more with a colon gets `<short pause>` after it. These tags are Gemini's (in English, even in Hebrew text) and are not spoken. Each clip is one sentence, so short ones need none.
- **Even loudness.** Gemini's loudness swings by about 8 dB between sentences, so every clip is leveled to −21 dB (close to the English recordings).
- **Numbers** are turned into Hebrew words first, as for Kokoro (below).
- **Many sentences in one request.** Google's first paid tier allows only **100 requests a day** for each model, so `--batch 80` (the default) sends 80 sentences of the same kind in one request, one per line with a long pause between them, and cuts the audio apart. The cuts are chosen by the silences and by how long each sentence should be from its letters. A piece whose length doesn't fit was probably cut in the wrong place: it is recorded again in a smaller batch, and at last on its own. The whole list needs about 80 requests. When the day's requests run out, the run stops and says so; run it again the next day and it carries on.
- **Cost.** You pay for the length of the speech, pauses included: about $0.001 a sentence with `gemini-3.8-flash-tts` in 2026 (Google says prices double on 1 Jan 2027). All ~5,600 sentences cost about $5. `--budget` (default $10) stops the run before it spends more; the run prints its cost as it goes.
- **Speed.** `--workers 4` sends 4 requests at once: 120 sentences took 24 seconds. A stopped run picks up where it left off. `--model` tries another model without changing line 1.

### Kokoro Hebrew (the old voice, free, non-commercial)

To use it again, set line 1 to `ENGINE=kokoro-hebrew VOICE=he_shaul SPEED=0.9`.

- **The engine.** [Kokoro Hebrew](https://huggingface.co/thewh1teagle/kokoro-hebrew-nc) is a Kokoro model trained on Hebrew, so it runs through the same `kokoro-onnx` as English. Hebrew is written without vowels, so [renikud](https://huggingface.co/thewh1teagle/renikud) first works out the vowels (nikud) and the sounds. It was the best free Hebrew voice we found that runs on a laptop CPU.
- **Downloads.** The first run downloads three files into `models/` from Hugging Face: `kokoro-hebrew.onnx`, `voices-hebrew.bin` and `renikud.onnx`, about 330 MB in all.
- **Words renikud reads wrong.** `HEBREW_SOUNDS` in `generate.py` gives the sounds for a whole sentence instead, e.g. "יששש!" (a stretched "יש!" on screen) is said `jˈeʃ!`; renikud reads it as a word, "yishashesh".
- **Sounds the voice says wrong.** `HEBREW_SOUND_FIXES` in `generate.py` changes sounds after renikud. "שש" (six) on its own came out as "sesh" (its first sh blurred into an s), so it is given a doubled sh, `ʃʃˈeʃ`. After adding a fix, record again every sentence it changes.
- **Numbers.** Digits are turned into Hebrew words first, in the counting form used for sums ("3 ועוד 4" is read "שלוש ועוד ארבע"). Numbers that count something ("שלושה תפוחים") are already written as words by the game.
- **Speed.** 3,399 sentences took about 50 minutes on a 4-core CPU with 4 parts at once (`--part 1/4` … `4/4`).
- **The voice.** `he_shaul` is a calm, clear male voice, and the only voice the model has. It is trained on a public Hebrew speech corpus (SASPEECH).
- **The licence.** The Hebrew model is free for **non-commercial** use only (see its model page). That is why the game now uses Gemini.
- **Other engines we looked at:**
  - Chatterbox Multilingual: MIT licence and can copy a female voice from a sample, but it needs about 3 GB of PyTorch and is slow on CPU.
  - Meta's MMS-TTS: non-commercial, and its voice sounds like a Bible reading.
  - phonikud-tts (Piper): non-commercial, research and education use only.
