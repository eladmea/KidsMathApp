"""Hebrew through Google's Gemini text-to-speech (paid, allowed in a product
that is sold). Used by generate.py when line 1 of the sentence file says
ENGINE=gemini. Needs GEMINI_API_KEY in the environment.

Each sentence is sent with a short style note (how to say it, never spoken)
picked from what the sentence says: praise is excited, a miss is gentle, a
question is curious, a single word is said carefully. Long sentences get a
breath or a pause. See hebrew_delivery().
"""
import base64
import io
import json
import os
import re
import threading
import time
import urllib.error
import urllib.request

URL = 'https://generativelanguage.googleapis.com/v1beta/interactions'
# US dollars per million tokens (text in, audio out), 2026 list prices.
# Audio is 25 tokens a second. Google says the prices double on 1 Jan 2027.
PRICES = {
    'gemini-3.8-flash-tts': (0.50, 9.00),
    'gemini-3.8-flash-lite-tts': (0.50, 6.00),
    'gemini-3.1-flash-tts-preview': (1.00, 20.00),
}
# Female studio voices worth comparing for a children's game (--samples).
SAMPLE_VOICES = ['Erinome', 'Kore', 'Sulafat', 'Vindemiatrix', 'Achernar', 'Leda']

# ---- how to say each sentence ----
TEACHER = 'A kind kindergarten teacher talking to a young child, clear and unhurried'
STYLES = {
    'celebrate': 'excited and proud, celebrating with a big smile',
    'gentle': 'gentle, kind and encouraging, never disappointed',
    'question': 'curious and playful, inviting the child to answer',
    'lively': 'cheerful and lively',
    'word': 'saying one word slowly and very clearly, for a child learning to read',
    'calm': 'warm and friendly',
}
# Praise and wins ("well done", "wow", "you got it").
CELEBRATE = re.compile(r'כל הכבוד|מצוי[ןנ]|יופי|נהדר|מדהים|וואו|יששש|^יש!|הצלחת|ניצחת|אלופ|מושלם|הידד|בדיוק!|נכון!|כן!|סיימת')
# A miss or a try again ("not here", "almost", "oops").
GENTLE = re.compile(r'לא כאן|לא נורא|כמעט|נסו שוב|ננסה שוב|אופס|לא בדיוק|עוד ניסיון|עוד פעם|לא זה')
# "You got 3 out of 10": excited for all of them, gentle for none.
SCORE = re.compile(r'הצלחתם (\d+) מתוך (\d+)')
# Emoji are shown on screen but not read aloud.
EMOJI = re.compile('[\U0001F000-\U0001FAFF☀-➿⬀-⯿️‍]+')


def hebrew_delivery(text):
    """(style, kind) for a sentence: what the voice is told, and why."""
    score = SCORE.search(text)
    if score:
        got, total = int(score.group(1)), int(score.group(2))
        kind = 'celebrate' if got == total else 'gentle' if got * 2 < total else 'lively'
    elif GENTLE.search(text):
        kind = 'gentle'
    elif CELEBRATE.search(text):
        kind = 'celebrate'
    elif text.rstrip().endswith('?'):
        kind = 'question'
    elif len(text.split()) <= 2 and not re.search(r'[.!?:,]', text):
        kind = 'word'
    elif text.rstrip().endswith('!'):
        kind = 'lively'
    else:
        kind = 'calm'
    return f'{TEACHER}: {STYLES[kind]}', kind


def with_breaths(text):
    """Long sentences: a breath first, and a short pause after a colon."""
    words = len(text.split())
    if words >= 10 and ':' in text:
        text = re.sub(r':\s*', ': <short pause> ', text, count=1)
    if words >= 14:
        text = '<breath> ' + text
    return text


class DailyLimit(RuntimeError):
    """The model's requests for today are used up (100 a day on the first paid tier)."""


class Gemini:
    """Records sentences with one voice, keeping count of what it costs."""

    def __init__(self, voice, model, budget):
        self.key = os.environ.get('GEMINI_API_KEY')
        if not self.key:
            raise SystemExit('Set GEMINI_API_KEY (see README "Hebrew").')
        if model not in PRICES:
            raise SystemExit(f'Unknown model {model}. Known: {", ".join(PRICES)}')
        self.voice, self.model, self.budget = voice, model, budget
        self.tokens_in = self.tokens_out = self.requests = 0
        self.lock = threading.Lock()

    @property
    def cost(self):
        price_in, price_out = PRICES[self.model]
        return (self.tokens_in * price_in + self.tokens_out * price_out) / 1e6

    def say(self, text, style, voice=None):
        """WAV bytes (24 kHz mono) for one sentence."""
        if self.cost >= self.budget:
            raise RuntimeError(f'budget of ${self.budget:.2f} reached')
        content = {'type': 'text', 'text': text, 'annotations': [{'type': 'speech_metadata', 'style': style}]}
        body = json.dumps({
            'model': self.model,
            'input': [{'type': 'user_input', 'content': [content]}],
            'response_format': {'type': 'audio'},
            'generation_config': {'speech_config': [{'voice': voice or self.voice}]},
        }).encode()
        for attempt in range(8):
            request = urllib.request.Request(URL, data=body, method='POST', headers={'x-goog-api-key': self.key, 'Content-Type': 'application/json'})
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    reply = json.load(response)
            except urllib.error.HTTPError as error:
                detail = error.read().decode('utf-8', 'replace')
                if error.code == 429 and re.search(r'per ?day', detail, re.IGNORECASE):
                    raise DailyLimit(detail[:300]) from None
                if error.code in (429, 500, 503):
                    time.sleep(min(60, 5 * 2**attempt))  # busy or rate limited: wait, then try again
                    continue
                raise RuntimeError(f'Gemini {error.code}: {detail[:300]}') from None
            except (urllib.error.URLError, TimeoutError):
                time.sleep(5 * (attempt + 1))
                continue
            audio = [c for s in reply.get('steps', []) if s.get('type') == 'model_output' for c in s.get('content', []) if c.get('type') == 'audio']
            if not audio:
                raise RuntimeError(f'no audio in the reply: {json.dumps(reply)[:300]}')
            usage = reply.get('usage', {})
            with self.lock:
                self.requests += 1
                self.tokens_in += usage.get('total_input_tokens', 0)
                self.tokens_out += usage.get('total_output_tokens', 0)
            return base64.b64decode(audio[-1]['data'])
        raise RuntimeError('Gemini stayed busy; try again later')


def wav_to_audio(data):
    """WAV bytes -> (float32 samples, sample rate)."""
    import numpy as np
    import soundfile

    audio, rate = soundfile.read(io.BytesIO(data), dtype='float32')
    return np.asarray(audio), rate


def prepare(text, hebrew_numbers):
    """The text Gemini reads: no emoji, sums and digits as Hebrew words."""
    spoken = re.sub(r'\s+', ' ', EMOJI.sub('', text)).strip()
    if not re.search(r'\w', spoken):
        raise RuntimeError('nothing to say (only emoji)')
    spoken = spoken.replace('+', ' ועוד ').replace('−', ' פחות ').replace('×', ' כפול ').replace('=', ' שווה ')
    return re.sub(r'\s+', ' ', hebrew_numbers(spoken)).strip()


# Gemini's loudness swings by about 8 dB from one sentence to the next, so
# every clip is brought to the same level: -21 dB, close to the English
# recordings, with the peaks kept below -1 dB.
LEVEL_DB = -21.0
PEAK = 10 ** (-1 / 20)


def level(audio):
    import numpy as np

    rms = float(np.sqrt(np.mean(np.square(audio)))) if len(audio) else 0.0
    peak = float(np.max(np.abs(audio))) if len(audio) else 0.0
    if rms <= 0 or peak <= 0:
        return audio
    gain = min(10 ** (LEVEL_DB / 20) / rms, PEAK / peak)
    return (audio * gain).astype('float32')


# ---- many sentences in one request ----
# The paid tier allows only 100 requests a day per model, so sentences are sent
# in batches: one per line, with a long pause between lines, and the audio is
# cut apart afterwards. Pauses inside a sentence can be as long as the ones
# between sentences, so the cuts are chosen by silence and length together:
# each sentence should last about as long as its letters predict.
BATCH_PAUSE = ' <long pause> <long pause>'


def batch_text(spoken):
    """One request's text: a sentence per line, a long pause after each."""
    return '\n'.join(s + BATCH_PAUSE for s in spoken[:-1]) + '\n' + spoken[-1]


def letters(text):
    return len(re.sub(r'<[^>]*>|[\W_]', '', text))


def split_batch(audio, rate, spoken, *, frame=0.01, min_gap=0.15, base=0.3):
    """Cut one batch's audio into one piece per sentence.

    Returns (pieces, fits): the samples of each sentence, and for each how well
    its length fits its letters (1.0 = exactly as expected). A piece far from
    1.0 was probably cut in the wrong place and should be recorded again.
    """
    import math

    import numpy as np

    n = len(spoken)
    f = max(1, int(rate * frame))
    frames = len(audio) // f
    rms = np.sqrt(np.mean(np.square(audio[: frames * f].reshape(frames, f)), axis=1))
    silent = rms < 0.03 * max(float(rms.max()), 1e-9)
    # Silent stretches between speech (not the edges): (start, end) in frames.
    gaps, start = [], None
    for i, s in enumerate(silent):
        if s and start is None:
            start = i
        elif not s and start is not None:
            if start > 0 and (i - start) * frame >= min_gap:
                gaps.append((start, i))
            start = None
    voiced = np.where(~silent)[0]
    first, last = (int(voiced[0]), int(voiced[-1]) + 1) if len(voiced) else (0, frames)
    if n == 1 or len(gaps) < n - 1:
        return [audio], [1.0] if n == 1 else [0.0] * n
    # Expected length of each sentence: a little for any sentence plus some for each letter,
    # the speed taken from this batch (the voice's pace changes a little from one request to the next).
    chars = [max(1, letters(s)) for s in spoken]
    longest = sorted((b - a for a, b in gaps), reverse=True)[: n - 1]
    speech = (last - first - sum(longest)) * frame
    per_letter = max(0.03, (speech - n * base) / sum(chars))
    expected = [base + per_letter * c for c in chars]
    # Best cuts by dynamic programming: points[0] is the start of speech, then
    # every gap, then the end. Sentence i runs from one point's gap end to a
    # later point's gap start. Score: how far each length is from expected
    # (on a log scale), minus a reward for cutting at long silences.
    points = [(first, first)] + gaps + [(last, last)]
    m = len(points)
    INF = float('inf')
    best = [[INF] * m for _ in range(n + 1)]
    back = [[-1] * m for _ in range(n + 1)]
    best[0][0] = 0.0
    for i in range(1, n + 1):
        final = i == n
        for q in range(1, m):
            if final and q != m - 1 or not final and q == m - 1:
                continue
            reward = 0.0 if final else 2.0 * math.log((points[q][1] - points[q][0]) * frame / min_gap)
            for p in range(q - 1, -1, -1):
                if best[i - 1][p] == INF:
                    continue
                length = (points[q][0] - points[p][1]) * frame
                if length > 4 * expected[i - 1] + 1:
                    break
                if length <= 0:
                    continue
                score = best[i - 1][p] + (math.log(length / expected[i - 1]) / 0.25) ** 2 - reward
                if score < best[i][q]:
                    best[i][q], back[i][q] = score, p
    if best[n][m - 1] == INF:
        return [audio], [0.0] * n
    cuts, q = [], m - 1
    for i in range(n, 0, -1):
        cuts.append(q)
        q = back[i][q]
    cuts.append(0)
    cuts.reverse()
    pieces, fits = [], []
    for i in range(n):
        a, b = points[cuts[i]], points[cuts[i + 1]]
        # Each piece keeps half of the silence on either side.
        start = (a[0] + a[1]) // 2 if i else max(0, a[0] - 10)
        end = (b[0] + b[1]) // 2 if i < n - 1 else min(frames, b[1] + 10)
        pieces.append(audio[start * f : end * f])
        fits.append((b[0] - a[1]) * frame / expected[i])
    return pieces, fits


# Added to a batch's style note.
BATCH_STYLE = '. Read each line as its own separate sentence, with a long pause between lines.'
# A piece is kept when its length is this close to what its letters predict.
FIT = (0.55, 1.8)
