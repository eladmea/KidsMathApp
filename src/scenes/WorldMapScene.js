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
import { bandName, skillTitle, subjectName } from '../i18n/names';
import { art } from '../ui/Art';

const CARD = { width: 220, height: 300, gap: 18 };

// The world map: one island per subject (placeholder cards until the island
// designs land), with the child's progress in their age band and the next
// skill to play, plus Daily Review when reviews are due.
export default class WorldMapScene extends BaseScene {
  static key = 'WorldMap';


  build() {
    if (this.timeUpGate()) return;
    const { profile, progress } = session;
    const band = profileBand(profile);
    this.sky = this.add.rectangle(0, 0, 10, 10, COLORS.sky).setOrigin(0, 0);
    this.sea = this.add.rectangle(0, 0, 10, 10, COLORS.sea).setOrigin(0, 0);
    this.add.text(SAFE.width / 2, 150, t('map.greeting', { name: profile.name }), textStyle(40, COLORS.white, { stroke: '#3552B5', strokeThickness: 8 })).setOrigin(0.5);
    this.add.text(SAFE.width / 2, 196, `${band.emoji} ${bandName(band)}`, textStyle(24, colorOf(band.color))).setOrigin(0.5);

    const islands = SUBJECTS.map((subject, i) => {
      const skills = skillsFor({ subject: subject.id, band: band.id }).filter(isPlayable);
      const passed = skills.filter((s) => hasPassed(getRecord(progress, s.id))).length;
      const mastered = skills.filter((s) => isMastered(getRecord(progress, s.id))).length;
      const next = recommendNextSkill(skills.filter((skill) => isAvailable(skill)), progress);
      const x = SAFE.width / 2 + (i - (SUBJECTS.length - 1) / 2) * (CARD.width + CARD.gap);
      const card = new Button(this, x, 400, { label: '', width: CARD.width, height: CARD.height, color: colorOf(subject.light), onTap: () => this.openIsland(subject) });
      card.box.setStrokeStyle(5, colorOf(subject.color));
      const barWidth = CARD.width - 40;
      card.add([
        art(this, 0, -86, { key: `islands/${subject.id}`, emoji: subject.emoji, size: 84 }),
        this.add.text(0, -6, subjectName(subject), textStyle(28, colorOf(subject.color), { wordWrap: { width: CARD.width - 20 } })).setOrigin(0.5),
        this.add.rectangle(-barWidth / 2, 50, barWidth, 16, COLORS.white).setOrigin(0, 0.5).setRounded(8),
        this.add.rectangle(-barWidth / 2, 50, skills.length ? (barWidth * passed) / skills.length : 0, 16, colorOf(subject.color)).setOrigin(0, 0.5).setRounded(8),
        this.add.text(0, 78, t('map.passed', { passed, total: skills.length }) + (mastered ? t('map.mastered', { mastered }) : ''), textStyle(22)).setOrigin(0.5),
        this.add.text(0, 118, next ? t('map.next', { emoji: next.emoji, title: skillTitle(next) }) : t('map.allDone'), textStyle(18, COLORS.ink, { wordWrap: { width: CARD.width - 24 } })).setOrigin(0.5),
      ]);
      this.tag(`island:${subject.id}`, card.box);
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

    speak(t('map.sayGreeting', { name: profile.name }));
    this.showNarration();
    this.report({ player: profile.name, band: band.id, islands, reviews: this.reviews, stickers: (profile.stickers || []).length, tickets: profile.funTickets || 0, minutesLeft: left, adventureDone });
  }

  layout() {
    const v = this.view;
    this.sky.setPosition(v.x, v.y).setSize(v.width, v.height);
    this.sea.setPosition(v.x, v.bottom - 60).setSize(v.width, 60);
    this.fullscreen.setPosition(v.right - 70, v.y + 60);
    this.narration.setPosition(v.right - 170, v.y + 60);
    this.player.setPosition(v.x + 160, v.y + 60);
    this.adventure.setPosition(SAFE.width / 2, v.y + 60);
    this.coach.setPosition(v.right - 380, v.y + 60);
  }

  openIsland(subject) {
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
