// Text with pictures: emoji that have a picture split out, the rest stays
// text, and right-to-left lines come back in drawing order.
import { iconRuns } from '../src/logic/iconRuns';

const star = (e) => e === '⭐';

describe('iconRuns', () => {
  it('keeps text without pictures as one run', () => {
    expect(iconRuns('2 / 5   🫧 3', star)).toEqual([{ text: '2 / 5   🫧 3' }]);
    expect(iconRuns('', star)).toEqual([]);
  });

  it('splits out emoji that have a picture', () => {
    expect(iconRuns('2 / 5   ⭐ 3', star)).toEqual([{ text: '2 / 5   ' }, { icon: '⭐' }, { text: ' 3' }]);
    expect(iconRuns('⭐⭐☆', star)).toEqual([{ icon: '⭐' }, { icon: '⭐' }, { text: '☆' }]);
  });

  it('keeps an emoji whole: variation selector, skin tone, joined parts', () => {
    const any = () => true;
    expect(iconRuns('⚙️ Settings', any)).toEqual([{ icon: '⚙️' }, { text: ' Settings' }]);
    expect(iconRuns('👍🏽!', any)).toEqual([{ icon: '👍🏽' }, { text: '!' }]);
    expect(iconRuns('🐻‍❄️', any)).toEqual([{ icon: '🐻‍❄️' }]);
    expect(iconRuns('☆✓', any)).toEqual([{ icon: '☆' }, { icon: '✓' }]);
  });

  it('orders a right-to-left line right to left', () => {
    const gear = (e) => e === '⚙️';
    expect(iconRuns('⚙️ הגדרות', gear, true)).toEqual([{ text: 'הגדרות ' }, { icon: '⚙️' }]);
    // Only lines with right-to-left letters, and only in a right-to-left language.
    expect(iconRuns('⚙️ 3', gear, true)).toEqual([{ icon: '⚙️' }, { text: ' 3' }]);
    expect(iconRuns('⚙️ הגדרות', gear, false)).toEqual([{ icon: '⚙️' }, { text: ' הגדרות' }]);
  });
});
