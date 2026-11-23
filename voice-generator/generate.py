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
              Lines starting with # are skipped. Make the file with
              `npm run voice:lines -- en --txt`: the file names come from the
              game (src/services/voiceClips.js clipId).

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
from pathlib import Path

HERE = Path(__file__).resolve().parent
SENTENCES = HERE / 'sentences_english.txt'
EXPORT = HERE / 'voices_export'
# Each language records into its own folder: a sentence with no words
# ("7", "3 + 4") has the same file name in every language.
EXPORT_FOLDERS = {'sentences_english.txt': EXPORT, 'sentences_hebrew.txt': EXPORT / 'he'}
MODELS = HERE / 'models'
RELEASE = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'
MODEL = 'kokoro-v1.0.onnx'
VOICES = 'voices-v1.0.bin'
# Kokoro's languages by LANG on line 1.
LANGUAGES = {'a': 'en-us', 'b': 'en-gb'}
# Hebrew (ENGINE=kokoro-hebrew on line 1): a Kokoro model trained on Hebrew,
# plus renikud, which works out the vowels (nikud) and the sounds of
# unvocalized Hebrew. Free for non-commercial use (see README).
HEBREW_FILES = {
    'kokoro-hebrew.onnx': 'https://huggingface.co/thewh1teagle/kokoro-hebrew-nc/resolve/main/kokoro.onnx',
    'voices-hebrew.bin': 'https://huggingface.co/thewh1teagle/kokoro-hebrew-nc/resolve/main/voices-hebrew.bin',
    'renikud.onnx': 'https://huggingface.co/thewh1teagle/renikud/resolve/neobert-130m/model.onnx',
}
RATE = 24000
BITRATE = '32k'
# A little silence before and after each sentence, in seconds.
PAD = 0.08
# The game's folder of recordings for each sentence file.
GAME_VOICE = {
    'sentences_english.txt': HERE.parent / 'src' / 'voice' / 'en',
    'sentences_hebrew.txt': HERE.parent / 'src' / 'voice' / 'he',
}
# Emoji are shown on screen but not read aloud.
EMOJI = re.compile('[\U0001F000-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u200D]+')
# Voices worth comparing for a children's game (see --samples).
SAMPLE_VOICES = ['af_heart', 'af_bella', 'af_nicole', 'af_sarah', 'af_sky', 'bf_emma', 'am_michael', 'am_puck']


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
        if '|' not in line:
            sys.exit(f'{path.name} line {number} has no file name. Make the list with: npm run voice:lines -- <language> --txt')
        name, text = (part.strip() for part in line.split('|', 1))
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


def download(name, url=None):
    MODELS.mkdir(exist_ok=True)
    target = MODELS / name
    if target.exists():
        return target
    print(f'Downloading {name} (once)...')
    partial = target.with_suffix('.part')
    urllib.request.urlretrieve(url or RELEASE + name, partial)
    partial.rename(target)
    return target


# ---- Hebrew numbers ----
# Digits are said as words before the vowels are worked out, in the counting
# (feminine) form a teacher uses for sums: "3 ועוד 4" -> "שלוש ועוד ארבע".
# Numbers that count a thing ("שלושה תפוחים") are already words in the game.
UNITS = ['אפס', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע']
TEENS = ['עשר', 'אחת עשרה', 'שתים עשרה', 'שלוש עשרה', 'ארבע עשרה', 'חמש עשרה', 'שש עשרה', 'שבע עשרה', 'שמונה עשרה', 'תשע עשרה']
TENS = ['', '', 'עשרים', 'שלושים', 'ארבעים', 'חמישים', 'שישים', 'שבעים', 'שמונים', 'תשעים']
HUNDREDS = ['', 'מאה', 'מאתיים', 'שלוש מאות', 'ארבע מאות', 'חמש מאות', 'שש מאות', 'שבע מאות', 'שמונה מאות', 'תשע מאות']


def hebrew_number(n):
    if n >= 1000:
        return str(n)
    if n < 10:
        return UNITS[n]
    parts = []
    if n >= 100:
        parts.append(HUNDREDS[n // 100])
        n %= 100
    if 10 <= n < 20:
        parts.append(TEENS[n - 10])
    elif n >= 20:
        parts.append(TENS[n // 10])
        if n % 10:
            parts.append(UNITS[n % 10])
    elif n:
        parts.append(UNITS[n])
    # "and" goes on the last part: מאה עשרים ושלוש, עשרים ואחת.
    if len(parts) > 1:
        parts[-1] = 'ו' + parts[-1]
    return ' '.join(parts)


def hebrew_numbers(text):
    # A prefix letter before a number ("מ-3", "ב-5") joins the word: "משלוש".
    text = re.sub(r'(?<![\u0590-\u05FF])([מבלהוכש])-(\d+)', lambda m: m.group(1) + hebrew_number(int(m.group(2))), text)
    return re.sub(r'\d+', lambda m: hebrew_number(int(m.group())), text)


# Letter sounds as the literacy pack spells them (SOUND_SPEECH: "mmm",
# "buh"), and how to say each one. Kokoro reads "mmm" as the letters
# "M M M", "eh" as "ay" and "th" as "T H", and says a consonant on its own
# with a vowel either side ("nnn" came out "eh-n-eh"). So each is said with
# a short "uh", like "buh" and "tuh" ("nuh", "shuh"): Kokoro says that
# cleanly, and play-testing chose it over a held "nnn". The screen still
# shows "mmm". The rest of the sentence is read as usual.
ENGLISH_SOUNDS = {
    'mmm': 'mˈʌ', 'nnn': 'nˈʌ', 'lll': 'lˈʌ', 'rrr': 'ɹˈʌ', 'sss': 'sˈʌ', 'fff': 'fˈʌ',
    'zzz': 'zˈʌ', 'vvv': 'vˈʌ', 'shh': 'ʃˈʌ', 'sh': 'ʃˈʌ', 'th': 'θˈʌ', 'ch': 'ʧˈʌ',
    'ks': 'ks', 'eh': 'ˈɛ', 'ih': 'ˈɪ', 'wh': 'wˈʌ',
}
# A whole word, not part of a spelled-out word ("b-a-th" keeps its letters).
SOUND_WORD = re.compile(r'(?<![\w-])(' + '|'.join(ENGLISH_SOUNDS) + r')(?![\w-])', re.IGNORECASE)
# A word spelled out letter by letter ("The answer is b, a, th."): its parts
# are read as letters, so none of them becomes a sound.
SPELLED = re.compile(r'(?<![\w-])[b-z](?![\w-])')


# English with letter sounds in it -> phonemes, or None to read it as usual.
def english_sounds(kokoro, text, language):
    parts = SOUND_WORD.split(text)
    if len(parts) == 1 or SPELLED.search(text):
        return None
    out = []
    for i, part in enumerate(parts):
        if i % 2:
            out.append(ENGLISH_SOUNDS[part.lower()])
        elif part.strip():
            out.append(kokoro.tokenizer.phonemize(part, language))
    return ' '.join(out)


# Hebrew sentences renikud reads wrong, and the sounds to say instead.
# "יששש!" is a stretched "יש!" (yes!) on screen; renikud reads it as a word.
# "איזו" (which, feminine) is read "eize", the masculine form.
HEBREW_SOUNDS = {'יששש!': 'jˈeʃ!', 'איזו אות זאת?': 'ʔˈejzo ʔˈot zˈot?'}

# Sounds the Hebrew voice says wrong, and what to give it instead. "שש" (six)
# on its own came out as "sesh": its first sh blurs into an s. A doubled sh
# keeps it a clear "shesh".
# "בחרו" is read "bacharu" (they chose); in the game it is always "bachru"
# (choose!).
WORD = r'(?<![^\s.,!?:;"]){}(?![^\s.,!?:;"])'
HEBREW_SOUND_FIXES = [
    (re.compile(WORD.format('ʃˈeʃ')), 'ʃʃˈeʃ'),
    (re.compile(WORD.format('baχaʁˈu')), 'baχʁˈu'),
]


def fix_hebrew_sounds(phonemes):
    for pattern, sounds in HEBREW_SOUND_FIXES:
        phonemes = pattern.sub(sounds, phonemes)
    return phonemes


def synthesize(kokoro, text, voice, speed, language, g2p=None):
    import numpy as np

    spoken = re.sub(r'\s+', ' ', EMOJI.sub('', text)).strip()
    if not re.search(r'\w', spoken):
        raise RuntimeError('nothing to say (only emoji)')
    if g2p is not None:
        # Hebrew: words -> sounds (with the vowels worked out), then speak the sounds.
        spoken = spoken.replace('+', ' ועוד ').replace('−', ' פחות ').replace('×', ' כפול ').replace('=', ' שווה ')
        phonemes = HEBREW_SOUNDS.get(spoken) or fix_hebrew_sounds(g2p.phonemize(hebrew_numbers(spoken)))
        audio, rate = kokoro.create(phonemes, voice=voice, speed=speed, is_phonemes=True)
    elif (phonemes := english_sounds(kokoro, spoken, language)) is not None:
        audio, rate = kokoro.create(phonemes, voice=voice, speed=speed, is_phonemes=True)
    else:
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
    # Mono, 32 kbit/s: clear speech at about 4 KB a second.
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-ac', '1', '-b:a', BITRATE, str(mp3)], check=True)
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
    export = EXPORT_FOLDERS.get(args.file.name, EXPORT / args.file.stem)
    hebrew = settings.get('ENGINE') == 'kokoro-hebrew'
    voice = args.voice or settings.get('VOICE', 'he_shaul' if hebrew else 'af_heart')
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

    g2p = None
    if hebrew:
        try:
            from renikud_onnx import G2P
        except ImportError:
            sys.exit('The Hebrew engine needs renikud. Run:  pip install -r requirements.txt')
        paths = {name: download(name, url) for name, url in HEBREW_FILES.items()}
        kokoro = Kokoro(str(paths['kokoro-hebrew.onnx']), str(paths['voices-hebrew.bin']))
        g2p = G2P(str(paths['renikud.onnx']))
    else:
        kokoro = Kokoro(str(download(MODEL)), str(download(VOICES)))
    if voice not in kokoro.get_voices():
        sys.exit(f'No voice "{voice}". Voices: {", ".join(sorted(kokoro.get_voices()))}')

    if args.samples:
        folder = export / '_samples'
        folder.mkdir(parents=True, exist_ok=True)
        text = sentences[0][1]
        # Hebrew: every voice its model has.
        for name in sorted(kokoro.get_voices()) if hebrew else SAMPLE_VOICES:
            path = save(synthesize(kokoro, text, name, speed, LANGUAGES.get(name[0], language), g2p), folder / name, use_mp3)
            print(f'  {path.relative_to(HERE)}')
        print(f'Listen, then put the voice you like on line 1 of {args.file.name} (VOICE=...).')
        return

    export.mkdir(parents=True, exist_ok=True)
    # Done: recorded here, or already in the game (its file names can change
    # when the game's clip ids do, so the game folder counts too).
    game = GAME_VOICE.get(args.file.name)
    done = lambda n: any((folder / f'{n}{ext}').exists() for folder in (export, game) if folder for ext in ('.mp3', '.wav'))
    todo = [(n, t) for n, t in sentences if args.force or not done(n)]
    if args.part:
        part, parts = (int(n) for n in args.part.split('/'))
        todo = todo[part - 1 :: parts]
    if args.limit:
        todo = todo[: args.limit]
    print(f'Voice {voice}, speed {speed}: {len(todo)} to record ({len(sentences) - len(todo)} already done).')
    failed = 0
    for i, (name, text) in enumerate(todo, start=1):
        try:
            path = save(synthesize(kokoro, text, voice, speed, language, g2p), export / name, use_mp3)
            print(f'  [{i}/{len(todo)}] {path.name}  "{text}"')
        except Exception as error:  # keep going: one bad sentence shouldn't stop the rest
            failed += 1
            print(f'  [{i}/{len(todo)}] FAILED "{text}": {error}')
    print(f'Done: {len(todo) - failed} recorded{f", {failed} failed" if failed else ""}, in {export.relative_to(HERE)}/.')
    if args.install:
        install(sentences, export, GAME_VOICE.get(args.file.name))


# Copies the recording of every listed sentence into the game, and removes
# recordings there whose sentence is no longer in the list. A listed sentence
# already in the game and not recorded here keeps its game recording.
def install(sentences, export, folder):
    if folder is None:
        sys.exit('No game folder known for this sentence file.')
    folder.mkdir(parents=True, exist_ok=True)
    wanted = set()
    for name, _ in sentences:
        for ext in ('.mp3', '.wav'):
            source = export / f'{name}{ext}'
            if source.exists():
                shutil.copy2(source, folder / source.name)
                wanted.add(source.name)
                break
        else:
            wanted.update(f'{name}{ext}' for ext in ('.mp3', '.wav') if (folder / f'{name}{ext}').exists())
    removed = 0
    for old in folder.iterdir():
        if old.suffix in ('.mp3', '.wav', '.ogg', '.m4a') and old.name not in wanted:
            old.unlink()
            removed += 1
    size = sum((folder / name).stat().st_size for name in wanted) / 1e6
    print(f'Installed {len(wanted)} recordings ({size:.1f} MB) in {folder}{f", removed {removed} old" if removed else ""}.')


if __name__ == '__main__':
    main()
