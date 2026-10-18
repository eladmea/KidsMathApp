// Right-to-left text (Hebrew, Arabic) for every Phaser Text.
//
// Phaser's own `rtl` style right-aligns every line and ignores `align`, so
// centred speech bubbles and buttons would come out lopsided. Instead, each
// line that has right-to-left letters is drawn as a right-to-left "isolate"
// (logic/bidi.js), so the browser orders it right to left while Phaser keeps
// measuring and aligning as usual. Left-aligned paragraphs line up on the
// right instead.
import Phaser from 'phaser';
import { isRtl } from '../i18n/index';
import { RTL_LETTER, rtlLine } from '../logic/bidi';

let installed = false;

export function installRtlText() {
  if (installed) return;
  installed = true;
  const proto = Phaser.GameObjects.Text.prototype;
  const updateText = proto.updateText;
  proto.updateText = function () {
    const text = this._text;
    if (!isRtl() || !text || !RTL_LETTER.test(text)) return updateText.call(this);
    const { style } = this;
    const wrapped = style.wordWrapWidth || style.wordWrapCallback ? this.runWordWrap(text) : text;
    const saved = { wordWrapWidth: style.wordWrapWidth, wordWrapCallback: style.wordWrapCallback, align: style.align };
    this._text = wrapped
      .split(this.splitRegExp)
      .map((line) => rtlLine(line))
      .join('\n');
    style.wordWrapWidth = 0;
    style.wordWrapCallback = null;
    if (style.align === 'left') style.align = 'right';
    try {
      return updateText.call(this);
    } finally {
      Object.assign(style, saved);
      this._text = text;
    }
  };
}
