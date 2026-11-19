import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import Dialog from '../ui/Dialog';
import { openParentGate } from '../ui/ParentGate';
import { COLORS, colorOf, textStyle } from '../ui/theme';
import { removeProfile, selectProfile, session } from '../services/session';
import { speak } from '../services/speech';
import { profileBand } from '../logic/profiles';
import { t } from '../i18n/index';
import { bandName } from '../i18n/names';
import { art, glyph } from '../ui/Art';

const CARD = { width: 240, height: 262, gap: 28, perRow: 4 };
// Two rows of players plus the "new player" card.
export const MAX_PLAYERS = CARD.perRow * 2 - 1;

// "Who's playing?": each child taps their own picture. Grown-ups can add
// players, or remove one after the grown-up check.
export default class ProfilesScene extends BaseScene {
  static key = 'Profiles';


  build() {
    this.managing = false;
    this.addBackdrop(COLORS.sky);
    // The title hangs on a wooden sign, when there's a picture of one.
    art(this, SAFE.width / 2, 80, { key: 'ui/sign', size: 380 });
    this.add.text(SAFE.width / 2, 76, t('players.whoIsPlaying'), textStyle(48, COLORS.white, { stroke: '#3552B5', strokeThickness: 10 })).setOrigin(0.5);
    this.cards = this.add.container(0, 0);
    // The grown-ups' links sit on soft white tags, readable over the beach.
    const tag = { backgroundColor: '#ffffffd9', padding: { x: 16, y: 8 } };
    this.manage = this.add.text(SAFE.width / 2, 676, '', textStyle(26, COLORS.ink, tag)).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.manage.on('pointerup', () => this.toggleManage());
    this.tag('manage', this.manage);
    this.grownUps = this.add.text(SAFE.width - 30, 676, t('players.grownUps'), textStyle(26, COLORS.ink, tag)).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    this.grownUps.on('pointerup', () => openParentGate(this, { title: t('parents.title'), onPass: () => this.go('ParentDashboard') }));
    this.tag('grown-ups', this.grownUps);
    this.drawCards();
    speak(t('players.tapYourPicture'));
  }

  drawCards() {
    this.cards.removeAll(true);
    const players = session.profiles;
    const items = [...players, ...(players.length < MAX_PLAYERS ? [null] : [])];
    const rows = Math.ceil(items.length / CARD.perRow);
    items.forEach((profile, i) => {
      const row = Math.floor(i / CARD.perRow);
      const inRow = Math.min(CARD.perRow, items.length - row * CARD.perRow);
      const x = SAFE.width / 2 + (i % CARD.perRow - (inRow - 1) / 2) * (CARD.width + CARD.gap);
      const y = 382 + (row - (rows - 1) / 2) * (CARD.height + CARD.gap);
      this.cards.add(profile ? this.playerCard(profile, x, y) : this.newCard(x, y));
    });
    this.manage.setText(this.managing ? t('common.done') : t('players.manage'));
    this.report({ players: players.map((p) => p.name), managing: this.managing });
  }

  playerCard(profile, x, y) {
    const band = profileBand(profile);
    const button = new Button(this, x, y, {
      label: '',
      width: CARD.width,
      height: CARD.height,
      color: COLORS.white,
      onTap: () => (this.managing ? this.confirmRemove(profile) : this.pick(profile)),
    });
    button.add([
      glyph(this, 0, -38, profile.avatar, 120),
      this.add.text(0, 60, profile.name, textStyle(36, COLORS.ink, { fixedWidth: CARD.width - 20 })).setOrigin(0.5),
      this.add.text(0, 100, `${band.emoji} ${bandName(band)}`, textStyle(22, colorOf(band.color))).setOrigin(0.5),
    ]);
    if (this.managing) button.add(this.add.text(CARD.width / 2 - 26, -CARD.height / 2 + 26, '✕', textStyle(34, COLORS.red)).setOrigin(0.5));
    this.tag(`player:${profile.name}`, button.box);
    return button;
  }

  newCard(x, y) {
    const button = new Button(this, x, y, {
      label: '',
      width: CARD.width,
      height: CARD.height,
      color: COLORS.green,
      onTap: () => this.go('CreateProfile', { first: false }),
    });
    button.add([
      art(this, 0, -38, { key: 'ui/new-player', emoji: '➕', size: 100 }),
      this.add.text(0, 72, t('players.newPlayerTitle'), textStyle(32, COLORS.white, { align: 'center', wordWrap: { width: CARD.width - 30 } })).setOrigin(0.5),
    ]);
    this.tag('new-player', button.box);
    return button;
  }

  async pick(profile) {
    await selectProfile(profile.id);
    this.reset('WorldMap');
  }

  toggleManage() {
    if (this.managing) {
      this.managing = false;
      this.drawCards();
      return;
    }
    openParentGate(this, {
      title: t('players.managePlayers'),
      onPass: () => {
        this.managing = true;
        this.drawCards();
      },
    });
  }

  confirmRemove(profile) {
    const dialog = new Dialog(this, { width: 640, height: 340, title: t('players.deleteTitle', { name: profile.name }) });
    const note = this.add.text(0, -30, t('players.deleteNote'), textStyle(28, COLORS.ink)).setOrigin(0.5);
    const yes = new Button(this, -140, 90, {
      label: t('players.delete'),
      width: 240,
      color: COLORS.red,
      onTap: async () => {
        dialog.close();
        await removeProfile(profile.id);
        if (!session.profiles.length) this.reset('CreateProfile', { first: true });
        else this.drawCards();
      },
    });
    const keep = new Button(this, 140, 90, { label: t('players.keep'), width: 240, color: COLORS.gray, onTap: () => dialog.close() });
    dialog.add([note, yes, keep]);
    this.tag('confirm-delete', yes.box);
    this.tag('keep', keep.box);
  }
}
