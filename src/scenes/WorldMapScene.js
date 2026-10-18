import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import { COLORS, colorOf, textStyle } from '../ui/theme';
import { session, timeLeft, updateProfile } from '../services/session';
import { isFinished } from '../logic/adventure';
import { WARN_MINUTES } from '../logic/playTime';
import { coachIntro } from '../i18n/names';
import { currentVoiceName, initSpeech, isNarrationOn, speak } from '../services/speech';
import { getDueReviews, getRecord, hasPassed, isMastered, recommendNextSkill, toDayKey } from '../logic/progress';
import { profileBand } from '../logic/profiles';
import { isAvailable } from '../logic/skillRoutes';
import { SUBJECTS } from '../curriculum/subjects';
import { isPlayable, skillsFor } from '../curriculum/skills';
import { t } from '../i18n/index';
import { bandName, subjectName } from '../i18n/names';
import { art, glyph } from '../ui/Art';
import { drawIsland } from '../ui/IslandArt';

// Where each island sits in the sea (by subject), and how big it is.
const ISLANDS = {
  math: { x: 175, y: 300 },
  literacy: { x: 420, y: 420 },
  science: { x: 645, y: 300 },
  logic: { x: 865, y: 420 },
  sel: { x: 1105, y: 300 },
};
const SIZE = { width: 236, height: 150 };

// The world map: the sea with an island per subject, the child's progress
// in their age band on each, and their avatar on the island they last
// visited. Above: the player, Today's Adventure, Play together, read-aloud
// and fullscreen; below: Daily Review (when due), Games, Fun Break and the
// sticker book.
export default class WorldMapScene extends BaseScene {
  static key = 'WorldMap';


  build() {
    if (this.timeUpGate()) return;
    const { profile, progress } = session;
    const band = profileBand(profile);
    this.sea = this.add.rectangle(0, 0, 10, 10, COLORS.sea).setOrigin(0, 0);
    this.sky = this.add.rectangle(0, 0, 10, 10, COLORS.sky).setOrigin(0, 0);
    this.drawWaves();
    this.drawClouds();
    this.add.text(SAFE.width / 2, 150, t('map.greeting', { name: profile.name }), textStyle(40, COLORS.white, { stroke: '#3552B5', strokeThickness: 8 })).setOrigin(0.5);
    this.add.text(SAFE.width / 2, 196, `${band.emoji} ${bandName(band)}`, textStyle(24, colorOf(band.color), { stroke: '#ffffff', strokeThickness: 5 })).setOrigin(0.5);

    const home = session.lastIsland || SUBJECTS[0].id;
    const islands = SUBJECTS.map((subject, i) => {
      const skills = skillsFor({ subject: subject.id, band: band.id }).filter(isPlayable);
      const passed = skills.filter((s) => hasPassed(getRecord(progress, s.id))).length;
      const mastered = skills.filter((s) => isMastered(getRecord(progress, s.id))).length;
      const next = recommendNextSkill(skills.filter((skill) => isAvailable(skill)), progress);
      const { x, y } = ISLANDS[subject.id];
      const island = this.add.container(x, y);
      island.add(drawIsland(this, 0, 0, { ...SIZE, seed: i + 1, land: colorOf(subject.light) }));
      island.add(art(this, 0, -12, { key: `islands/${subject.id}`, emoji: subject.emoji, size: 72 }));
      const ribbon = this.add.text(0, SIZE.height / 2 + 4, subjectName(subject), textStyle(24, COLORS.white, { backgroundColor: subject.color, padding: { x: 14, y: 4 } })).setOrigin(0.5);
      const count = this.add.text(0, SIZE.height / 2 + 34, t('map.passed', { passed, total: skills.length }) + (mastered ? t('map.mastered', { mastered }) : ''), textStyle(20, COLORS.ink, { stroke: '#ffffff', strokeThickness: 4 })).setOrigin(0.5);
      island.add([ribbon, count]);
      // The whole island is the button; it squishes when pressed.
      const zone = this.add.zone(x, y + 15, SIZE.width + 20, SIZE.height + 70).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.tweens.add({ targets: island, scale: 0.94, duration: 80, yoyo: true }));
      zone.on('pointerup', () => this.openIsland(subject));
      this.tag(`island:${subject.id}`, zone);
      // A gentle bob, each island in its own time.
      this.tweens.add({ targets: island, y: y - 5, duration: 1800 + i * 230, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      if (subject.id === home) {
        const avatar = glyph(this, 62, -40, profile.avatar, 52);
        island.add(avatar);
        this.tweens.add({ targets: avatar, y: -52, duration: 500, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
      }
      return { subject: subject.id, passed, total: skills.length, next: next ? next.id : null };
    });

    // The bottom row: Daily Review (when due), Games, Fun Break, Stickers.
    this.reviews = getDueReviews(progress, toDayKey());
    const row = [
      this.reviews.length && { name: 'review', label: t('map.review'), color: COLORS.yellow, onTap: () => this.go('Quiz', { skillIds: this.reviews, mode: 'review' }) },
      { name: 'games', label: t('map.games'), color: COLORS.white, onTap: () => this.go('Games') },
      { name: 'fun-break', label: t('map.funBreak', { count: profile.funTickets || 0 }), color: COLORS.white, onTap: () => this.go('FunBreak') },
      { name: 'stickers', label: t('map.stickers', { count: (profile.stickers || []).length }), color: COLORS.white, onTap: () => this.go('StickerBook') },
    ].filter(Boolean);
    const width = row.length > 3 ? 285 : 330;
    row.forEach(({ name, label, color, onTap }, i) => {
      const x = SAFE.width / 2 + (i - (row.length - 1) / 2) * (width + 14);
      const button = new Button(this, x, 625, { label, width, height: 84, fontSize: 26, color, textColor: COLORS.ink, onTap });
      this.tag(name, button.box);
    });

    this.player = new Button(this, 0, 0, { label: `${profile.avatar} ${profile.name}`, width: 260, height: 84, fontSize: 34, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.reset('Profiles') });
    this.tag('switch-player', this.player.box);
    this.narration = new Button(this, 0, 0, { label: '', width: 84, height: 84, fontSize: 40, color: COLORS.white, onTap: () => this.toggleNarration() });
    this.tag('narration', this.narration.box);
    this.fullscreen = new Button(this, 0, 0, { label: '⛶', width: 84, height: 84, fontSize: 44, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.toggleFullscreen() });
    this.tag('fullscreen', this.fullscreen.box);
    // Today's Adventure, and "Play together" for a grown-up sitting with them.
    const adventureDone = isFinished(session.adventure);
    this.adventure = new Button(this, SAFE.width / 2, 0, { label: t(adventureDone ? 'adventure.mapDone' : 'adventure.mapButton'), width: 420, height: 84, fontSize: 30, color: adventureDone ? COLORS.white : COLORS.green, textColor: adventureDone ? COLORS.greenDark : COLORS.white, onTap: () => this.go('Adventure') });
    this.tag('adventure', this.adventure.box);
    this.coach = new Button(this, 0, 0, { label: '', width: 300, height: 84, fontSize: 26, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.toggleCoach() });
    this.tag('coach', this.coach.box);
    const left = timeLeft();
    if (left !== null && left <= WARN_MINUTES) this.add.text(SAFE.width / 2, 228, t('timeUp.warn', { count: left }), textStyle(24, COLORS.orange, { stroke: '#ffffff', strokeThickness: 5 })).setOrigin(0.5);
    this.showCoach();

    this.voice = this.add.text(SAFE.width / 2, 700, '', textStyle(18, COLORS.ink)).setOrigin(0.5).setAlpha(0.6);
    initSpeech().then(() => this.sys.isActive() && this.voice.setText(t('common.voice', { name: currentVoiceName() || t('common.deviceVoice') })));

    speak(t('map.sayGreeting'));
    this.showNarration();
    this.report({ player: profile.name, band: band.id, home, islands, reviews: this.reviews, stickers: (profile.stickers || []).length, tickets: profile.funTickets || 0, minutesLeft: left, adventureDone });
  }

  layout() {
    const v = this.view;
    this.sea.setPosition(v.x, v.y).setSize(v.width, v.height);
    this.sky.setPosition(v.x, v.y).setSize(v.width, 110 - v.y);
    this.fullscreen.setPosition(v.right - 70, v.y + 60);
    this.narration.setPosition(v.right - 170, v.y + 60);
    this.player.setPosition(v.x + 160, v.y + 60);
    this.coach.setPosition(v.right - 380, v.y + 60);
    // Between the player button and "Play together", so they never overlap.
    this.adventure.setPosition((v.x + 290 + v.right - 530) / 2, v.y + 60);
  }

  // Little white waves that come and go across the sea.
  drawWaves() {
    for (let i = 0; i < 26; i++) {
      const x = 40 + ((i * 197) % 1200);
      const y = 240 + ((i * 89) % 440);
      const wave = this.add.text(x, y, '〰', textStyle(26, COLORS.white)).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: wave, alpha: 0.7, x: x + 14, duration: 1400 + (i % 5) * 300, delay: (i % 7) * 400, yoyo: true, repeat: -1 });
    }
  }

  // Clouds drifting across the sky band.
  drawClouds() {
    [0, 1, 2].forEach((i) => {
      const cloud = this.add.container(-200 + i * 520, 40 + (i % 2) * 30).setAlpha(0.9);
      [[0, 0, 34], [30, -10, 28], [58, 2, 26], [-28, 6, 22]].forEach(([dx, dy, r]) => cloud.add(this.add.circle(dx, dy, r, COLORS.white)));
      this.tweens.add({ targets: cloud, x: cloud.x + 1500, duration: 60000 + i * 9000, repeat: -1, onRepeat: () => cloud.setX(-300) });
    });
  }

  openIsland(subject) {
    session.lastIsland = subject.id;
    speak(subjectName(subject));
    this.go('Island', { subjectId: subject.id });
  }

  showCoach() {
    this.coach.setLabel(t(session.coaching ? 'map.coachOn' : 'map.coachOff')).setColor(session.coaching ? 0xffe08a : COLORS.white);
    this.report({ coaching: session.coaching });
  }

  toggleCoach() {
    session.coaching = !session.coaching;
    this.showCoach();
    if (session.coaching) speak(coachIntro(), { force: true });
  }

  showNarration() {
    this.narration.setLabel(isNarrationOn() ? '🔊' : '🔇');
    this.report({ narration: isNarrationOn() });
  }

  async toggleNarration() {
    await updateProfile({ narration: !isNarrationOn() });
    this.showNarration();
    if (isNarrationOn()) speak(t('common.readToYou'));
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
