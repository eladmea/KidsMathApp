import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import StarRow from '../ui/StarRow';
import { COLORS, colorOf, textStyle } from '../ui/theme';
import { session } from '../services/session';
import { speak } from '../services/speech';
import { getRecord, isUnlocked, missingPrereqs, recommendNextSkill, skillStars } from '../logic/progress';
import { profileBand } from '../logic/profiles';
import { isAvailable, skillScene } from '../logic/skillRoutes';
import { getSubject } from '../curriculum/subjects';
import { AGE_BANDS } from '../curriculum/ageBands';
import { skillsFor } from '../curriculum/skills';
import { list, t } from '../i18n/index';
import { skillTitle, subjectName } from '../i18n/names';
import { art } from '../ui/Art';

const CARD = { width: 280, height: 132, gapX: 22, gapY: 20, perRow: 4 };

// An island's skills for one age band (placeholder layout until the island
// designs land). Children start on their own band and can peek at the
// others. A skill opens once its prerequisites are passed; games not rebuilt
// yet say "coming soon".
//   data: { subjectId, bandId }
export default class IslandScene extends BaseScene {
  static key = 'Island';


  build({ subjectId, bandId }) {
    this.subject = getSubject(subjectId);
    this.bandId = bandId || profileBand(session.profile).id;
    this.bg = this.add.rectangle(0, 0, 10, 10, colorOf(this.subject.light)).setOrigin(0, 0);
    this.addBackButton();
    this.add.text(SAFE.width / 2, 60, t('island.title', { emoji: this.subject.emoji, name: subjectName(this.subject) }), textStyle(48, colorOf(this.subject.color))).setOrigin(0.5);
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
    this.message = this.add.text(SAFE.width / 2, 690, '', textStyle(26, COLORS.ink)).setOrigin(0.5);

    const skills = skillsFor({ subject: subjectId, band: this.bandId });
    const next = recommendNextSkill(skills.filter((skill) => isAvailable(skill)), session.progress);
    const rows = Math.ceil(skills.length / CARD.perRow);
    const report = skills.map((skill, i) => {
      const row = Math.floor(i / CARD.perRow);
      const inRow = Math.min(CARD.perRow, skills.length - row * CARD.perRow);
      const x = SAFE.width / 2 + ((i % CARD.perRow) - (inRow - 1) / 2) * (CARD.width + CARD.gapX);
      const y = 260 + row * (CARD.height + CARD.gapY) + (rows < 3 ? 40 : 0);
      const status = !isAvailable(skill) ? 'soon' : isUnlocked(skill, session.progress) ? 'ready' : 'locked';
      this.skillCard(skill, x, y, status, next && next.id === skill.id);
      return { id: skill.id, status };
    });
    this.report({ subject: subjectId, band: this.bandId, skills: report, next: next ? next.id : null });
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  skillCard(skill, x, y, status, isNext) {
    const card = new Button(this, x, y, { label: '', width: CARD.width, height: CARD.height, color: COLORS.white, onTap: () => this.open(skill, status) });
    card.box.setStrokeStyle(isNext ? 6 : 3, isNext ? COLORS.yellow : colorOf(this.subject.color));
    const faded = status !== 'ready';
    card.add([
      art(this, -CARD.width / 2 + 52, -6, { key: `skills/${skill.id}`, emoji: skill.emoji, size: 56 }).setAlpha(faded ? 0.4 : 1),
      this.add.text(-CARD.width / 2 + 100, -24, skillTitle(skill), textStyle(24, faded ? COLORS.gray : COLORS.ink, { align: 'left', wordWrap: { width: CARD.width - 115 } })).setOrigin(0, 0.5),
    ]);
    if (status === 'ready') card.add(new StarRow(this, 40, 34, skillStars(getRecord(session.progress, skill.id)), 26));
    if (status === 'locked') card.add(this.add.text(40, 34, '🔒', textStyle(30)).setOrigin(0.5));
    if (status === 'soon') card.add(this.add.text(40, 34, t('island.soon'), textStyle(22, COLORS.gray)).setOrigin(0.5));
    if (isNext) card.add(this.add.text(CARD.width / 2 - 14, -CARD.height / 2 + 4, t('island.next'), textStyle(20, COLORS.ink, { backgroundColor: '#FFD23F', padding: { x: 8, y: 2 } })).setOrigin(1, 0.5));
    this.tag(`skill:${skill.id}`, card.box);
  }

  open(skill, status) {
    if (status === 'ready') {
      const { key, data } = skillScene(skill);
      this.go(key, data);
      return;
    }
    const line = status === 'locked' ? t('island.firstPlay', { skills: list(missingPrereqs(skill, session.progress).map(skillTitle)) }) : t('island.comingSoon', { title: skillTitle(skill) });
    this.message.setText(line);
    speak(line, { force: true });
    this.report({ message: line });
  }
}
