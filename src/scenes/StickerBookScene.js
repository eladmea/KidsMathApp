import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import { COLORS, textStyle } from '../ui/theme';
import { session } from '../services/session';
import { speak } from '../services/speech';
import { PAGE_SIZE, stickerPages } from '../logic/stickers';
import { t } from '../i18n/index';

const COLS = 6;

// The sticker book: stickers earned for passing and mastering skills, a page
// of twelve at a time, with empty slots still to fill.
//   data: { page }
export default class StickerBookScene extends BaseScene {
  static key = 'StickerBook';


  build({ page }) {
    const stickers = session.profile.stickers || [];
    const pages = stickerPages(stickers);
    this.page = Math.min(page ?? pages.length - 1, pages.length - 1);
    this.bg = this.add.rectangle(0, 0, 10, 10, 0xfff1c7).setOrigin(0, 0);
    this.addBackButton();
    this.add.text(SAFE.width / 2, 60, t('stickers.title'), textStyle(48, COLORS.orange)).setOrigin(0.5);
    this.add.text(SAFE.width / 2, 118, t('stickers.count', { count: stickers.length }), textStyle(26, COLORS.gray)).setOrigin(0.5);
    pages[this.page].forEach((sticker, i) => {
      const x = SAFE.width / 2 + ((i % COLS) - (COLS - 1) / 2) * 160;
      const y = 280 + Math.floor(i / COLS) * 180;
      this.add.rectangle(x, y, 140, 150, COLORS.white, sticker ? 1 : 0.5).setRounded(24).setStrokeStyle(4, sticker && sticker.kind === 'mastered' ? COLORS.yellow : 0xe8dcc0);
      this.add.text(x, y, sticker ? sticker.emoji : '', textStyle(84)).setOrigin(0.5);
    });
    if (pages.length > 1) {
      const prev = new Button(this, 120, 380, { label: '◀', width: 90, height: 90, fontSize: 44, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.swap('StickerBook', { page: this.page - 1 }) });
      const next = new Button(this, 1160, 380, { label: '▶', width: 90, height: 90, fontSize: 44, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.swap('StickerBook', { page: this.page + 1 }) });
      prev.setEnabled(this.page > 0);
      next.setEnabled(this.page < pages.length - 1);
      this.tag('prev-page', prev.box);
      this.tag('next-page', next.box);
      this.add.text(SAFE.width / 2, 650, t('stickers.page', { page: this.page + 1, pages: pages.length }), textStyle(24, COLORS.gray)).setOrigin(0.5);
    }
    speak(stickers.length ? t('stickers.sayLook') : t('stickers.sayNone'));
    this.report({ count: stickers.length, page: this.page, pages: pages.length, perPage: PAGE_SIZE });
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }
}
