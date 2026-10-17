import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import { COLORS, colorOf, textStyle, FONT } from '../ui/theme';
import { addProfile, session } from '../services/session';
import { speak } from '../services/speech';
import { AVATARS, MAX_NAME_LENGTH, isValidName } from '../logic/profiles';
import { MAX_AGE, MIN_AGE, bandForAge } from '../curriculum/ageBands';

const AGES = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);

// A new player: name (a real text field over the canvas, so phones show
// their keyboard), age and an animal buddy. A grown-up helps fill it in.
//   data: { first } — the very first player can't cancel.
export default class CreateProfileScene extends BaseScene {
  constructor() {
    super('CreateProfile');
  }

  build({ first = !session.profiles.length }) {
    this.first = first;
    this.age = 4;
    this.avatar = AVATARS[0];
    this.bg = this.add.rectangle(0, 0, 10, 10, COLORS.cream).setOrigin(0, 0);
    if (!first) this.addBackButton();
    this.add.text(SAFE.width / 2, 56, first ? '👋 Welcome!' : 'New player', textStyle(52, COLORS.primary)).setOrigin(0.5);
    this.add.text(SAFE.width / 2, 108, 'A grown-up can help set this up.', textStyle(24, COLORS.gray)).setOrigin(0.5);

    this.add.text(250, 180, 'Name', textStyle(30)).setOrigin(1, 0.5);
    this.nameField = this.add.dom(SAFE.width / 2, 180, 'input', `width: 560px; height: 64px; box-sizing: border-box; border: 4px solid #4A6FE3; border-radius: 20px; padding: 0 20px; font: 600 34px ${FONT}; color: #2D3142; background: #fff; outline: none;`);
    const input = this.nameField.node;
    Object.assign(input, { type: 'text', placeholder: "Child's name", maxLength: MAX_NAME_LENGTH, autocomplete: 'off', spellcheck: false, ariaLabel: 'Name' });
    input.setAttribute('autocapitalize', 'words');
    input.addEventListener('input', () => this.refresh());
    input.addEventListener('keydown', (event) => event.key === 'Enter' && this.save());

    this.add.text(250, 290, 'Age', textStyle(30)).setOrigin(1, 0.5);
    this.ageButtons = AGES.map((age, i) => {
      const button = new Button(this, 320 + i * 92, 290, { label: String(age), width: 80, height: 80, fontSize: 36, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.setAge(age) });
      this.tag(`age:${age}`, button.box);
      return button;
    });
    this.bandNote = this.add.text(SAFE.width / 2 + 60, 352, '', textStyle(26)).setOrigin(0.5);

    this.add.text(250, 450, 'Buddy', textStyle(30)).setOrigin(1, 0.5);
    this.avatarButtons = AVATARS.map((avatar, i) => {
      const button = new Button(this, 320 + (i % 5) * 110, 420 + Math.floor(i / 5) * 100, { label: avatar, width: 92, height: 88, fontSize: 52, color: COLORS.white, onTap: () => this.setAvatar(avatar) });
      this.tag(`avatar:${avatar}`, button.box);
      return button;
    });
    this.preview = this.add.text(1040, 470, '', textStyle(130)).setOrigin(0.5);

    this.saveButton = new Button(this, SAFE.width / 2, 650, { label: "Let's go! ▶", width: 400, height: 92, color: COLORS.green, onTap: () => this.save() });
    this.tag('save', this.saveButton.box);
    this.setAge(this.age);
    this.setAvatar(this.avatar);
    speak(first ? "Welcome! Let's make your player." : 'A new player! What is their name?');
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  setAge(age) {
    this.age = age;
    const band = bandForAge(age);
    this.ageButtons.forEach((button, i) => {
      const selected = AGES[i] === age;
      button.setColor(selected ? colorOf(bandForAge(AGES[i]).color) : COLORS.white);
      button.label.setColor(selected ? '#ffffff' : '#2d3142');
    });
    this.bandNote.setText(`${band.emoji} ${band.label} (ages ${band.minAge}-${band.maxAge})`).setColor(band.color);
    this.refresh();
  }

  setAvatar(avatar) {
    this.avatar = avatar;
    this.avatarButtons.forEach((button) => {
      const selected = button.label.text === avatar;
      button.setColor(selected ? COLORS.yellow : COLORS.white);
      button.setScale(selected ? 1.08 : 1);
    });
    this.preview.setText(avatar);
    this.tweens.add({ targets: this.preview, scale: { from: 1.2, to: 1 }, duration: 200 });
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
    await addProfile({ name: this.name(), age: this.age, avatar: this.avatar });
    this.reset('WorldMap');
  }
}
