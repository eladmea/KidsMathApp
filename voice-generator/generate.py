#!/usr/bin/env python3
"""Records MathPlay's sentences with Kokoro, a free AI voice that runs on
your own computer (https://huggingface.co/hexgrad/Kokoro-82M), through
kokoro-onnx (no PyTorch needed). The first run downloads the model files
(about 340 MB) into models/.

    python generate.py                     every sentence not recorded yet
    python generate.py --force             record them all again
    python generate.py --limit 5           just the first 5 (to try it out)
    python generate.py --samples           the first sentence in several voices,
                                           to pick one (voices_export/_samples/)
    python generate.py --voice af_bella    another voice than line 1 says
    python generate.py --part 1/2          half of them (run --part 2/2 at the same
                                           time in another window: faster)
    python generate.py --install           then copy them into the game
                                           (../src/voice/en/), removing old ones

Reads sentences_english.txt:
    line 1    the settings, e.g.  VOICE=af_heart SPEED=0.9 LANG=a  # why
    then      one sentence per line:  <file name> | <sentence>
              (or just the sentence: the file name is then worked out the
              same way the game does it). Lines starting with # are skipped.

Writes voices_export/<file name>.mp3 (or .wav without ffmpeg). The game
plays src/voice/en/<file name>.mp3 instead of the device voice, so copying
the files there is all it takes.
"""
import argparse
import re
import urllib.request
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
SENTENCES = HERE / 'sentences_english.txt'
EXPORT = HERE / 'voices_export'
MODELS = HERE / 'models'
RELEASE = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'
MODEL = 'kokoro-v1.0.onnx'
VOICES = 'voices-v1.0.bin'
# Kokoro's languages by LANG on line 1.
LANGUAGES = {'a': 'en-us', 'b': 'en-gb'}
RATE = 24000
# A little silence before and after each sentence, in seconds.
PAD = 0.08
# The game's folder of recordings for each sentence file.
GAME_VOICE = {'sentences_english.txt': HERE.parent / 'src' / 'voice' / 'en'}
# Emoji are shown on screen but not read aloud.
EMOJI = re.compile('[\U0001F000-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u200D]+')
# Voices worth comparing for a children's game (see --samples).
SAMPLE_VOICES = ['af_heart', 'af_bella', 'af_nicole', 'af_sarah', 'af_sky', 'bf_emma', 'am_michael', 'am_puck']


# ---- the game's clip ids (src/services/voiceClips.js clipId) ----
def normalize(text):
    return re.sub(r'\s+', ' ', text.strip())


def fnv1a(text):
    h = 0x811C9DC5
    for ch in text:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f'{h:08x}'


def clip_id(text):
    clean = normalize(text)
    slug = unicodedata.normalize('NFKD', clean.lower())
    slug = re.sub(r'[^a-z0-9]+', '-', slug).strip('-')[:40].rstrip('-')
    return f'{slug}-{fnv1a(clean)}' if slug else fnv1a(clean)


# ---- reading the sentence file ----
def read_sentences(path):
    lines = path.read_text(encoding='utf-8').splitlines()
    if not lines:
        sys.exit(f'{path.name} is empty.')
    settings = {}
    for token in lines[0].split('#', 1)[0].split():
        if '=' in token:
            key, value = token.split('=', 1)
            settings[key.strip().upper()] = value.strip()
    sentences = []
    for number, line in enumerate(lines[1:], start=2):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if '|' in line:
            name, text = (part.strip() for part in line.split('|', 1))
        else:
            name, text = clip_id(line), line
        if not text:
            print(f'  line {number}: no sentence, skipped')
            continue
        sentences.append((name, text))
    return settings, sentences


# ---- making the sound ----
def trim(audio, threshold=0.01):
    import numpy as np

    loud = np.where(np.abs(audio) > threshold)[0]
    if not len(loud):
        return audio
    pad = int(PAD * RATE)
    return audio[max(0, loud[0] - pad) : loud[-1] + pad]


def download(name):
    MODELS.mkdir(exist_ok=True)
    target = MODELS / name
    if target.exists():
        return target
    print(f'Downloading {name} (once)...')
    partial = target.with_suffix('.part')
    urllib.request.urlretrieve(RELEASE + name, partial)
    partial.rename(target)
    return target


def synthesize(kokoro, text, voice, speed, language):
    import numpy as np

    spoken = re.sub(r'\s+', ' ', EMOJI.sub('', text)).strip()
    audio, rate = kokoro.create(spoken, voice=voice, speed=speed, lang=language)
    if rate != RATE:
        raise RuntimeError(f'unexpected sample rate {rate}')
    return trim(np.asarray(audio, dtype='float32'))


def save(audio, target_without_extension, use_mp3):
    import soundfile

    wav = target_without_extension.with_suffix('.wav')
    soundfile.write(wav, audio, RATE)
    if not use_mp3:
        return wav
    mp3 = target_without_extension.with_suffix('.mp3')
    # Mono, 48 kbit/s: clear speech at about 6 KB a second.
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-ac', '1', '-b:a', '48k', str(mp3)], check=True)
    wav.unlink()
    return mp3


def main():
    parser = argparse.ArgumentParser(description='Record the game sentences with Kokoro.')
    parser.add_argument('--file', type=Path, default=SENTENCES, help='the sentence file (default: sentences_english.txt)')
    parser.add_argument('--voice', help='a Kokoro voice, instead of line 1')
    parser.add_argument('--speed', type=float, help='speaking speed, instead of line 1 (1.0 = normal)')
    parser.add_argument('--force', action='store_true', help='record again sentences that already have a file')
    parser.add_argument('--limit', type=int, help='record at most this many')
    parser.add_argument('--samples', action='store_true', help='the first sentence in several voices, to choose one')
    parser.add_argument('--wav', action='store_true', help='keep WAV files instead of MP3')
    parser.add_argument('--install', action='store_true', help="copy the recordings into the game's voice folder")
    parser.add_argument('--part', help='record only part of the list, e.g. 1/2 and 2/2 in two windows at once')
    args = parser.parse_args()

    settings, sentences = read_sentences(args.file)
    voice = args.voice or settings.get('VOICE', 'af_heart')
    speed = args.speed or float(settings.get('SPEED', '0.9'))
    # Kokoro's language: 'a' American English, 'b' British English.
    lang = settings.get('LANG', voice[0])
    language = LANGUAGES.get(lang, 'en-us')
    use_mp3 = not args.wav and shutil.which('ffmpeg') is not None
    if not args.wav and not use_mp3:
        print('ffmpeg not found: saving WAV files (bigger). Install ffmpeg for MP3.')
    if not sentences:
        sys.exit('No sentences to record.')

    try:
        from kokoro_onnx import Kokoro
    except ImportError:
        sys.exit('Kokoro is not installed. Run:  pip install -r requirements.txt')

    kokoro = Kokoro(str(download(MODEL)), str(download(VOICES)))
    if voice not in kokoro.get_voices():
        sys.exit(f'No voice "{voice}". Voices: {", ".join(sorted(kokoro.get_voices()))}')

    if args.samples:
        folder = EXPORT / '_samples'
        folder.mkdir(parents=True, exist_ok=True)
        text = sentences[0][1]
        for name in SAMPLE_VOICES:
            path = save(synthesize(kokoro, text, name, speed, LANGUAGES.get(name[0], language)), folder / name, use_mp3)
            print(f'  {path.relative_to(HERE)}')
        print(f'Listen, then put the voice you like on line 1 of {args.file.name} (VOICE=...).')
        return

    EXPORT.mkdir(exist_ok=True)
    todo = [(n, t) for n, t in sentences if args.force or not any((EXPORT / f'{n}{ext}').exists() for ext in ('.mp3', '.wav'))]
    if args.part:
        part, parts = (int(n) for n in args.part.split('/'))
        todo = todo[part - 1 :: parts]
    if args.limit:
        todo = todo[: args.limit]
    print(f'Voice {voice}, speed {speed}: {len(todo)} to record ({len(sentences) - len(todo)} already done).')
    failed = 0
    for i, (name, text) in enumerate(todo, start=1):
        try:
            path = save(synthesize(kokoro, text, voice, speed, language), EXPORT / name, use_mp3)
            print(f'  [{i}/{len(todo)}] {path.name}  "{text}"')
        except Exception as error:  # keep going: one bad sentence shouldn't stop the rest
            failed += 1
            print(f'  [{i}/{len(todo)}] FAILED "{text}": {error}')
    print(f'Done: {len(todo) - failed} recorded{f", {failed} failed" if failed else ""}, in {EXPORT.relative_to(HERE)}/.')
    if args.install:
        install(sentences, GAME_VOICE.get(args.file.name))


# Copies the recording of every listed sentence into the game, and removes
# recordings there whose sentence is no longer in the list.
def install(sentences, folder):
    if folder is None:
        sys.exit('No game folder known for this sentence file.')
    folder.mkdir(parents=True, exist_ok=True)
    wanted = set()
    for name, _ in sentences:
        for ext in ('.mp3', '.wav'):
            source = EXPORT / f'{name}{ext}'
            if source.exists():
                shutil.copy2(source, folder / source.name)
                wanted.add(source.name)
                break
    removed = 0
    for old in folder.iterdir():
        if old.suffix in ('.mp3', '.wav', '.ogg', '.m4a') and old.name not in wanted:
            old.unlink()
            removed += 1
    size = sum((folder / name).stat().st_size for name in wanted) / 1e6
    print(f'Installed {len(wanted)} recordings ({size:.1f} MB) in {folder}{f", removed {removed} old" if removed else ""}.')


if __name__ == '__main__':
    main()
