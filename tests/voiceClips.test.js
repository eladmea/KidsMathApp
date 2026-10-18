import { clipId, clipUrl, normalize } from '../src/services/voiceClips';

describe('voice clips', () => {
  it('gives each sentence a stable, readable file name', () => {
    expect(clipId('How many apples?')).toMatch(/^how-many-apples-[0-9a-f]{8}$/);
    expect(clipId('How many apples?')).toBe(clipId('  How  many apples? '));
    expect(clipId('How many apples?')).not.toBe(clipId('How many stars?'));
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
