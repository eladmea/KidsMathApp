import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import { COLORS, textStyle } from '../ui/theme';
import StarRow from '../ui/StarRow';
import { session, updateProfile } from '../services/session';
import { currentVoiceName, initSpeech, isNarrationOn, speak } from '../services/speech';
import { getRecord, skillStars } from '../logic/progress';
import { getSkill } from '../curriculum/skills';

// P0: a simple start screen with the two spike games. The world map and
// islands replace it in later phases.
const GAMES = [
  { skillId: 'math-count-5', scene: 'Quiz', color: COLORS.primary },
  { skillId: 'math-pizza', scene: 'Pizza', color: COLORS.sauce },
];

export default class HomeScene extends BaseScene {
  constructor() {
    super('Home');
  }

  build() {
    this.sky = this.add.rectangle(0, 0, 10, 10, COLORS.sky).setOrigin(0, 0);
    this.sea = this.add.rectangle(0, 0, 10, 10, COLORS.sea).setOrigin(0, 0);
    this.add.text(SAFE.width / 2, 110, 'MathPlay', textStyle(88, COLORS.white, { stroke: '#3552B5', strokeThickness: 12 })).setOrigin(0.5);
    this.add.text(SAFE.width / 2, 190, `Hi, ${session.profile.name}! ${session.profile.avatar}`, textStyle(40, COLORS.ink)).setOrigin(0.5);

    GAMES.forEach((game, i) => {
      const skill = getSkill(game.skillId);
      const x = SAFE.width / 2 + (i - (GAMES.length - 1) / 2) * 400;
      const stars = skillStars(getRecord(session.progress, skill.id));
      const button = new Button(this, x, 380, {
        label: `${skill.emoji}\n${skill.title}`,
        width: 340,
        height: 220,
        fontSize: 44,
        color: game.color,
        onTap: () => this.go(game.scene, { skillId: skill.id }),
      });
      this.tag(skill.id, button.box);
      new StarRow(this, x, 520, stars, 40);
    });

    // The player chip: tap to switch to someone else.
    this.player = new Button(this, 0, 0, {
      label: `${session.profile.avatar} ${session.profile.name}`,
      width: 260,
      height: 84,
      fontSize: 34,
      color: COLORS.white,
      textColor: COLORS.ink,
      onTap: () => this.reset('Profiles'),
    });
    this.tag('switch-player', this.player.box);
    this.narration = new Button(this, 0, 0, { label: '', width: 84, height: 84, fontSize: 40, color: COLORS.white, onTap: () => this.toggleNarration() });
    this.tag('narration', this.narration.box);
    this.showNarration();

    this.fullscreen = new Button(this, 0, 0, { label: '⛶', width: 84, height: 84, fontSize: 44, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.toggleFullscreen() });
    this.tag('fullscreen', this.fullscreen.box);
    this.voice = this.add.text(SAFE.width / 2, 650, '', textStyle(22, COLORS.ink)).setOrigin(0.5).setAlpha(0.7);

    initSpeech().then(() => {
      if (!this.sys.isActive()) return;
      this.voice.setText(`Voice: ${currentVoiceName() || 'device default'}`);
    });
    speak(`Hi, ${session.profile.name}! What do you want to play?`);
    this.report({ games: GAMES.map((g) => g.skillId), player: session.profile.name });
  }

  layout() {
    const v = this.view;
    this.sky.setPosition(v.x, v.y).setSize(v.width, v.height);
    this.sea.setPosition(v.x, v.bottom - 90).setSize(v.width, 90);
    this.fullscreen.setPosition(v.right - 70, v.y + 70);
    this.narration.setPosition(v.right - 170, v.y + 70);
    this.player.setPosition(v.x + 160, v.y + 70);
  }

  showNarration() {
    this.narration.setLabel(isNarrationOn() ? '🔊' : '🔇');
    this.report({ narration: isNarrationOn() });
  }

  async toggleNarration() {
    await updateProfile({ narration: !isNarrationOn() });
    this.showNarration();
    if (isNarrationOn()) speak('I will read to you.');
  }

  toggleFullscreen() {
    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
      return;
    }
    this.scale.startFullscreen();
    // Phones may then allow locking to landscape.
    try {
      window.screen.orientation?.lock?.('landscape').catch(() => {});
    } catch (e) {
      // Not supported here.
    }
  }
}
