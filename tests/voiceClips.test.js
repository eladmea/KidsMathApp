import { clipId, clipUrl, normalize, spokenForm } from '../src/services/voiceClips';

describe('voice clips', () => {
  it('gives each sentence a stable, readable file name', () => {
    expect(clipId('How many apples?')).toMatch(/^how-many-apples-[0-9a-f]{8}$/);
    expect(clipId('How many apples?')).toBe(clipId('  How  many apples? '));
    expect(clipId('How many apples?')).not.toBe(clipId('How many stars?'));
  });

  // Listening showed the voice says these the same way, so they share one
  // recording (ARCHITECTURE.md "Record the voice").
  it('gives sentences with the same spoken words one recording', () => {
    expect(spokenForm('Cat.', 'en')).toBe('cat');
    ['cat', 'cat!', 'CAT?', ' Cat… '].forEach((text) => expect(clipId(text, 'en')).toBe(clipId('Cat.', 'en')));
    ['9', '9.', '9!', 'Nine!', 'nine'].forEach((text) => expect(clipId(text, 'en')).toBe(clipId('9.', 'en')));
    expect(clipId('So apple goes there!', 'en')).toBe(clipId('so apple goes there.', 'en'));
    ['5', '5.', 'חמש!'].forEach((text) => expect(clipId(text, 'he')).toBe(clipId('5!', 'he')));
    expect(clipId('אותה תבנית, מראה חדש!', 'he')).toBe(clipId('אותה תבנית, מראה חדש.', 'he'));
    expect(clipUrl('cat!', 'en')).toBe(clipUrl('Cat.', 'en'));
    expect(clipUrl('cat!', 'en')).toBeTruthy();
  });

  it('keeps different words apart', () => {
    expect(clipId('10 × 10 = 100', 'en')).not.toBe(clipId('10 10 100', 'en'));
    expect(clipId('Or 9?', 'en')).not.toBe(clipId('9?', 'en'));
    expect(clipId('3.5', 'en')).not.toBe(clipId('3, 5', 'en'));
    expect(spokenForm('What is 55 plus 37?', 'en')).toBe('what is 55 plus 37');
    expect(clipId('Cat.', 'en')).not.toBe(clipId('Hat.', 'en'));
  });

  it('names sentences without Latin letters by their hash', () => {
    expect(clipId('כמה תפוחים?')).toMatch(/^[0-9a-f]{8}$/);
  });

  it('keeps long file names short', () => {
    expect(clipId('Count them one by one: 1, 2, 3, 4, 5. There are 5 cookies!').length).toBeLessThanOrEqual(49);
  });

  it('finds the recording of a sentence, and none for one never recorded', () => {
    expect(clipUrl('How many apples?', 'en')).toMatch(/how-many-apples-[0-9a-f]{8}\.mp3$/);
    expect(clipUrl('What is 55 plus 37?', 'en')).toBeNull();
    expect(clipUrl('How many apples?', 'xx')).toBeNull();
    expect(normalize(' a  b ')).toBe('a b');
  });
});

describe('picking a voice for the language', async () => {
  const { pickBestVoice, rankVoice } = await import('../src/logic/voices');
  const voices = [
    { identifier: 'en', name: 'Samantha', language: 'en-US' },
    { identifier: 'he', name: 'Carmit', language: 'he-IL' },
    { identifier: 'he2', name: 'Google עברית', language: 'he' },
  ];

  it('only picks voices for the language asked for', () => {
    expect(pickBestVoice(voices, { language: 'en-US' })).toBe('en');
    expect(['he', 'he2']).toContain(pickBestVoice(voices, { language: 'he-IL' }));
    expect(rankVoice(voices[0], { language: 'he-IL' })).toBe(-1000);
  });
});
