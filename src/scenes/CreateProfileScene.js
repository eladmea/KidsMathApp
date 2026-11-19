import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import { COLORS, colorOf, textStyle, FONT } from '../ui/theme';
import { addProfile, session } from '../services/session';
import { speak } from '../services/speech';
import { AVATARS, MAX_NAME_LENGTH, isValidName } from '../logic/profiles';
import { MAX_AGE, MIN_AGE, bandForAge } from '../curriculum/ageBands';
import { getLanguage, languages, setLanguage, t } from '../i18n/index';
import { bandName } from '../i18n/names';
import { glyph } from '../ui/Art';

const AGES = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);

// The buddies sit in rows of five, and the Language row goes under the last
// one, so adding a buddy never pushes them into each other.
const BUDDY = { perRow: 5, top: 386, step: 90, height: 80 };
const BUDDY_ROWS = Math.ceil(AVATARS.length / BUDDY.perRow);
const buddyY = (row) => BUDDY.top + row * BUDDY.step;
const LANGUAGE_Y = buddyY(BUDDY_ROWS - 1) + BUDDY.height / 2 + 52;

// A new player: name (a real text field over the canvas, so phones show
// their keyboard), age and an animal buddy. A grown-up helps fill it in.
//   data: { first } — the very first player can't cancel.
export default class CreateProfileScene extends BaseScene {
  static key = 'CreateProfile';

  // The same beach as "Who's playing?".
  static backdropName() {
    return 'Profiles';
  }

  build({ first = !session.profiles.length }) {
    this.first = first;
    this.age = 4;
    this.avatar = AVATARS[0];
    this.addBackdrop(COLORS.cream);
    // A soft cream card for the form, so it reads well over the beach.
    this.add.graphics().fillStyle(COLORS.cream, 0.93).fillRoundedRect(20, 12, SAFE.width - 40, SAFE.height - 24, 36);
    if (!first) this.addBackButton();
    this.add.text(SAFE.width / 2, 56, first ? t('players.welcome') : t('players.newPlayerTitle'), textStyle(52, COLORS.primary)).setOrigin(0.5);
    this.add.text(SAFE.width / 2, 108, t('players.grownUpHelp'), textStyle(24, COLORS.gray)).setOrigin(0.5);

    this.add.text(250, 170, t('players.name'), textStyle(30)).setOrigin(1, 0.5);
    this.nameField = this.add.dom(SAFE.width / 2, 170, 'input', `width: 560px; height: 64px; box-sizing: border-box; border: 4px solid #4A6FE3; border-radius: 20px; padding: 0 20px; font: 600 34px ${FONT}; color: #2D3142; background: #fff; outline: none;`);
    const input = this.nameField.node;
    Object.assign(input, { type: 'text', placeholder: t('players.namePlaceholder'), maxLength: MAX_NAME_LENGTH, autocomplete: 'off', ariaLabel: t('players.name') });
    // No spellcheck: false here. With autocomplete off, Android keyboards can
    // take it as a password-like field and lock to English (no Hebrew).
    input.setAttribute('autocapitalize', 'words');
    // Each name runs its own way (a Hebrew name in an English game too).
    input.setAttribute('dir', 'auto');
    input.addEventListener('input', () => this.refresh());
    input.addEventListener('keydown', (event) => event.key === 'Enter' && this.save());

    this.add.text(250, 262, t('players.age'), textStyle(30)).setOrigin(1, 0.5);
    this.ageButtons = AGES.map((age, i) => {
      const button = new Button(this, 320 + i * 92, 262, { label: String(age), width: 80, height: 80, fontSize: 36, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.setAge(age) });
      this.tag(`age:${age}`, button.box);
      return button;
    });
    this.bandNote = this.add.text(SAFE.width / 2 + 60, 318, '', textStyle(26)).setOrigin(0.5);

    const buddiesMiddle = (buddyY(0) + buddyY(BUDDY_ROWS - 1)) / 2;
    this.add.text(250, buddiesMiddle, t('players.buddy'), textStyle(30)).setOrigin(1, 0.5);
    this.avatarButtons = AVATARS.map((avatar, i) => {
      const button = new Button(this, 320 + (i % BUDDY.perRow) * 110, buddyY(Math.floor(i / BUDDY.perRow)), { label: avatar, width: 92, height: BUDDY.height, fontSize: 50, color: COLORS.white, onTap: () => this.setAvatar(avatar) });
      this.tag(`avatar:${avatar}`, button.box);
      return button;
    });
    this.previewSpot = { x: 1040, y: buddiesMiddle };
    this.preview = null;

    // Shown once there's more than one language to pick from.
    this.language = getLanguage();
    if (languages().length > 1) this.languagePicker();

    this.saveButton = new Button(this, SAFE.width / 2, 650, { label: t('players.save'), width: 400, height: 92, color: COLORS.green, onTap: () => this.save() });
    this.tag('save', this.saveButton.box);
    this.setAge(this.age);
    this.setAvatar(this.avatar);
    speak(first ? t('players.sayWelcome') : t('players.sayNewPlayer'));
  }

  setAge(age) {
    this.age = age;
    const band = bandForAge(age);
    this.ageButtons.forEach((button, i) => {
      const selected = AGES[i] === age;
      button.setColor(selected ? colorOf(bandForAge(AGES[i]).color) : COLORS.white);
      button.label.setColor(selected ? '#ffffff' : '#2d3142');
    });
    this.bandNote.setText(t('players.band', { emoji: band.emoji, band: bandName(band), min: band.minAge, max: band.maxAge })).setColor(band.color);
    this.refresh();
  }

  languagePicker() {
    this.add.text(250, LANGUAGE_Y, t('players.language'), textStyle(30)).setOrigin(1, 0.5);
    languages().forEach((language, i) => {
      const selected = language.id === this.language;
      const button = new Button(this, 380 + i * 200, LANGUAGE_Y, {
        label: language.name,
        width: 180,
        height: 64,
        fontSize: 26,
        color: selected ? COLORS.primary : COLORS.white,
        textColor: selected ? COLORS.white : COLORS.ink,
        // The form itself switches language, so a grown-up can read it.
        onTap: () => {
          setLanguage(language.id);
          this.swap('CreateProfile', { first: this.first });
        },
      });
      this.tag(`language:${language.id}`, button.box);
    });
  }

  setAvatar(avatar) {
    this.avatar = avatar;
    this.avatarButtons.forEach((button) => {
      const selected = button.label.text === avatar;
      button.setColor(selected ? COLORS.yellow : COLORS.white);
      button.setScale(selected ? 1.08 : 1);
    });
    // The chosen buddy, big (its picture, like everywhere else).
    if (this.preview) this.preview.destroy();
    this.preview = glyph(this, this.previewSpot.x, this.previewSpot.y, avatar, 130);
    const scale = this.preview.scale;
    this.tweens.add({ targets: this.preview, scale: { from: scale * 1.2, to: scale }, duration: 200 });
    this.refresh();
  }

  name() {
    return this.nameField ? this.nameField.node.value : '';
  }

  refresh() {
    if (!this.saveButton) return;
    this.saveButton.setEnabled(isValidName(this.name()));
    this.report({ name: this.name(), age: this.age, avatar: this.avatar, canSave: isValidName(this.name()) });
  }

  async save() {
    if (!isValidName(this.name()) || this.saving) return;
    this.saving = true;
    await addProfile({ name: this.name(), age: this.age, avatar: this.avatar, language: this.language });
    this.reset('WorldMap');
  }
}
