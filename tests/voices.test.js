import { splitSentences } from '../src/logic/voices';

describe('splitting speech into sentences', () => {
  it('splits after . ! ? and … but keeps the marks', () => {
    expect(splitSentences('Count them. There are 3!  Well done? Yes… ok')).toEqual(['Count them.', 'There are 3!', 'Well done?', 'Yes…', 'ok']);
  });

  it("doesn't split inside numbers or without a space after the mark", () => {
    expect(splitSentences('Half of 3.5 is 1.75.')).toEqual(['Half of 3.5 is 1.75.']);
  });

  it('breaks very long sentences at commas', () => {
    const long = Array.from({ length: 12 }, (_, i) => `part number ${i} of the sentence`).join(', ');
    const chunks = splitSentences(long, 100);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => expect(chunk.length).toBeLessThanOrEqual(100));
    expect(chunks.join(' ')).toBe(long);
  });

  it('copes with empty text', () => {
    expect(splitSentences('')).toEqual([]);
    expect(splitSentences('   ')).toEqual([]);
  });
});
