import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import StarRow from '../ui/StarRow';
import { art, glyph } from '../ui/Art';
import { drawIsland } from '../ui/IslandArt';
import { COLORS, colorOf, textStyle } from '../ui/theme';
import { earnStickers, session } from '../services/session';
import { speak } from '../services/speech';
import { play } from '../services/audio';
import { getRecord, missingPrereqs, recommendNextSkill, skillStars } from '../logic/progress';
import { islandComplete, pathStops, stopStatus } from '../logic/islandPath';
import { profileBand } from '../logic/profiles';
import { isAvailable, skillScene } from '../logic/skillRoutes';
import { getSubject } from '../curriculum/subjects';
import { AGE_BANDS } from '../curriculum/ageBands';
import { skillsFor } from '../curriculum/skills';
import { list, t } from '../i18n/index';
import { skillTitle, subjectName } from '../i18n/names';

const STOP_RADIUS = 50;
const ROAD = 0xe9cf96;

// An island: a winding road of stops, one per skill of an age band, ending
// in a treasure chest that opens once every stop is passed. The child's
// avatar waits at the next stop to play. Children start on their own band
// and can peek at the others. A stop opens once its prerequisites are
// passed.
//   data: { subjectId, bandId }
export default class IslandScene extends BaseScene {
  static key = 'Island';

  build({ subjectId, bandId }) {
    if (this.timeUpGate()) return;
    this.subject = getSubject(subjectId);
    this.bandId = bandId || profileBand(session.profile).id;
    const color = colorOf(this.subject.color);
    this.bg = this.add.rectangle(0, 0, 10, 10, COLORS.sea).setOrigin(0, 0);
    drawIsland(this, SAFE.width / 2, 445, { width: 1230, height: 470, seed: 7, land: colorOf(this.subject.light) });
    this.addBackButton();
    this.add.text(SAFE.width / 2, 60, t('island.title', { emoji: this.subject.emoji, name: subjectName(this.subject) }), textStyle(48, color, { stroke: '#ffffff', strokeThickness: 8 })).setOrigin(0.5);
    AGE_BANDS.forEach((band, i) => {
      const selected = band.id === this.bandId;
      const pill = new Button(this, SAFE.width / 2 + (i - 1.5) * 190, 140, {
        label: t('island.ages', { emoji: band.emoji, min: band.minAge, max: band.maxAge }),
        width: 170,
        height: 60,
        fontSize: 26,
        color: selected ? colorOf(band.color) : COLORS.white,
        textColor: selected ? COLORS.white : colorOf(band.color),
        onTap: () => this.swap('Island', { subjectId, bandId: band.id }),
      });
      this.tag(`band:${band.id}`, pill.box);
    });
    this.message = this.add.text(SAFE.width / 2, 690, '', textStyle(26, COLORS.ink, { backgroundColor: '#ffffffcc', padding: { x: 12, y: 4 } })).setOrigin(0.5).setVisible(false);

    this.skills = skillsFor({ subject: subjectId, band: this.bandId });
    const next = recommendNextSkill(this.skills.filter((skill) => isAvailable(skill)), session.progress);
    const { stops, chest } = pathStops(this.skills.length, { top: 330, bottom: 540 });
    this.drawRoad([...stops, chest]);
    const report = this.skills.map((skill, i) => {
      const stop = stopStatus(skill, session.progress);
      this.drawStop(skill, stops[i], stop, next && next.id === skill.id);
      // `status` as a child can use it: 'ready' (open to play), 'locked' or 'soon'.
      const status = stop === 'passed' || stop === 'mastered' ? 'ready' : stop;
      return { id: skill.id, status, stop };
    });
    this.complete = islandComplete(this.skills, session.progress);
    this.drawChest(chest);
    if (!next) this.placeAvatar(chest);
    this.report({ subject: subjectId, band: this.bandId, skills: report, next: next ? next.id : null, complete: this.complete });
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  // A sandy road through the stops, with a dashed middle line.
  drawRoad(points) {
    const road = this.add.graphics();
    road.lineStyle(34, ROAD, 1);
    road.beginPath();
    points.forEach(({ x, y }, i) => (i ? road.lineTo(x, y) : road.moveTo(x, y)));
    road.strokePath();
    road.fillStyle(ROAD, 1);
    points.forEach(({ x, y }) => road.fillCircle(x, y, 17));
    road.fillStyle(COLORS.white, 0.8);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const dashes = Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / 34);
      for (let d = 1; d < dashes; d++) road.fillCircle(a.x + ((b.x - a.x) * d) / dashes, a.y + ((b.y - a.y) * d) / dashes, 4);
    }
  }

  drawStop(skill, { x, y }, stop, isNext) {
    const color = colorOf(this.subject.color);
    const done = stop === 'passed' || stop === 'mastered';
    const closed = stop === 'locked' || stop === 'soon';
    if (isNext) {
      const ring = this.add.circle(x, y, STOP_RADIUS + 12, COLORS.yellow, 0.9);
      this.tweens.add({ targets: ring, scale: 1.12, alpha: 0.5, duration: 700, yoyo: true, repeat: -1 });
      this.placeAvatar({ x, y });
    }
    const circle = this.add.circle(x, y, STOP_RADIUS, done ? color : closed ? 0xe4e4e4 : COLORS.white).setStrokeStyle(6, stop === 'mastered' ? 0xf2b441 : closed ? 0xbdbdbd : color);
    circle.setInteractive({ useHandCursor: true });
    circle.on('pointerup', () => this.open(skill, stop));
    circle.on('pointerdown', () => this.tweens.add({ targets: circle, scale: 0.92, duration: 70, yoyo: true }));
    this.tag(`skill:${skill.id}`, circle);
    art(this, x, y, { key: `skills/${skill.id}`, emoji: skill.emoji, size: 52 }).setAlpha(closed ? 0.45 : 1);
    this.add.text(x, y + STOP_RADIUS + 22, skillTitle(skill), textStyle(18, closed ? COLORS.gray : COLORS.ink, { wordWrap: { width: 170 }, stroke: '#ffffff', strokeThickness: 4 })).setOrigin(0.5, 0);
    if (stop === 'locked') glyph(this, x + 36, y - 36, '🔒', 28);
    if (stop === 'soon') glyph(this, x + 36, y - 36, '🚧', 28);
    if (stop === 'mastered') glyph(this, x + 38, y - 38, '🏅', 30);
    if (done) new StarRow(this, x, y - STOP_RADIUS - 16, skillStars(getRecord(session.progress, skill.id)), 22);
  }

  // The child's avatar, hopping gently beside a stop.
  placeAvatar({ x, y }) {
    const avatar = glyph(this, x - 62, y - 50, session.profile.avatar, 50).setDepth(5);
    this.tweens.add({ targets: avatar, y: y - 62, duration: 480, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
  }

  drawChest({ x, y }) {
    const key = `${this.subject.id}-${this.bandId}`;
    const opened = (session.profile.stickers || []).some((s) => s.key === `chest:${key}`);
    this.add.circle(x, y, STOP_RADIUS + 6, this.complete ? 0xffe08a : 0xf3e6c4).setStrokeStyle(5, 0xc9873a);
    this.chest = glyph(this, x, y, opened ? '👑' : '🎁', 60);
    if (this.complete && !opened) this.tweens.add({ targets: this.chest, angle: { from: -8, to: 8 }, duration: 300, yoyo: true, repeat: -1 });
    const zone = this.add.zone(x, y, (STOP_RADIUS + 10) * 2, (STOP_RADIUS + 10) * 2).setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => this.openChest(key));
    this.tag('chest', zone);
  }

  async openChest(key) {
    if (!this.complete) {
      this.say(t('island.chestLocked'));
      return;
    }
    const earned = await earnStickers([{ kind: 'chest', ref: key }]);
    if (!this.sys.isActive()) return;
    this.tweens.killTweensOf(this.chest);
    this.chest.setAngle(0);
    if (earned.length) {
      play(this, 'correct');
      this.chest.destroy();
      this.chest = glyph(this, this.chest.x, this.chest.y, '👑', 60);
      this.celebrate(this.chest.x, this.chest.y);
      this.say(t('island.chestSticker', { emoji: earned[0].emoji }), t('island.chestSay'));
    } else {
      this.say(t('island.chestOpened'), t('island.chestSay'));
    }
    this.report({ chest: earned.length ? 'opened' : 'already', sticker: earned.length ? earned[0].emoji : null });
  }

  celebrate(x, y) {
    ['⭐', '✨', '🎉', '💎', '⭐', '✨'].forEach((emoji, i) => {
      const spark = glyph(this, x, y, emoji, 34).setDepth(10);
      const angle = (i / 6) * Math.PI * 2;
      this.tweens.add({ targets: spark, x: x + Math.cos(angle) * 110, y: y + Math.sin(angle) * 90, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => spark.destroy() });
    });
  }

  say(line, spoken = line) {
    this.message.setText(line).setVisible(true);
    speak(spoken, { force: true });
    this.report({ message: line });
  }

  open(skill, stop) {
    if (stop !== 'locked' && stop !== 'soon') {
      const { key, data } = skillScene(skill);
      this.go(key, data);
      return;
    }
    this.say(stop === 'locked' ? t('island.firstPlay', { skills: list(missingPrereqs(skill, session.progress).map(skillTitle)) }) : t('island.comingSoon', { title: skillTitle(skill) }));
  }
}
