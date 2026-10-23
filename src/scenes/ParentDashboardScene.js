import BaseScene, { SAFE } from '../ui/BaseScene';
import Button from '../ui/Button';
import Dialog from '../ui/Dialog';
import { glyph } from '../ui/Art';
import { COLORS, FONT, colorOf, textStyle } from '../ui/theme';
import { grantMoreTime, session, updateProfileById } from '../services/session';
import { appendPlayLog, clearPlayLog, loadPlayLog, loadProgress } from '../services/storage';
import { chooseVoice, currentVoiceName, listVoices, speak, voiceChoice } from '../services/speech';
import { exportTextFile } from '../services/exportFile';
import { isOnlineVoice } from '../logic/voices';
import { profileBand } from '../logic/profiles';
import { getRecord, hasPassed, isMastered, toDayKey } from '../logic/progress';
import { BONUS_MINUTES, LIMIT_OPTIONS, allowedMinutes, dailyLimitFor, minutesPlayed, recentDays } from '../logic/playTime';
import { daysPlayed, notesOf, skillReport, toCsv } from '../logic/playLog';
import { SUBJECTS } from '../curriculum/subjects';
import { isPlayable, skillsFor } from '../curriculum/skills';
import { bandName, skillTitle, subjectName } from '../i18n/names';
import { FALLBACK, getLanguage, languages, t } from '../i18n/index';

// The grown-ups' dashboard (opened from "Who's playing?" behind the
// grown-up check): for each child, today's play time and the last week,
// the daily limit, read-aloud, progress per subject and the play-test
// report with session notes; the read-aloud voice; and a CSV export of every
// child's play-test log.
const LEFT = 60;
const RIGHT = 680;
const TOP = 215;
const BAR_HEIGHT = 80;
const REPORT_ROWS = 7;
const MAX_VOICES = 7;

export default class ParentDashboardScene extends BaseScene {
  static key = 'ParentDashboard';

  build({ tab, page = 'menu' } = {}) {
    this.today = toDayKey();
    this.tab = tab || (session.profiles[0] ? session.profiles[0].id : 'settings');
    // In the Settings tab: the menu, or one of its pages ('language', 'voice').
    this.page = page;
    this.showingReport = false;
    this.content = [];
    this.tabs = [];
    this.progressById = {};
    this.logsById = {};

    this.bg = this.add.rectangle(0, 0, 10, 10, 0xf5f6fb).setOrigin(0, 0);
    this.addBackButton();
    this.add.text(SAFE.width / 2, 60, t('parents.title'), textStyle(40)).setOrigin(0.5);
    this.add.text(SAFE.width / 2, 105, t('parents.intro'), textStyle(18, COLORS.gray, { wordWrap: { width: 900 } })).setOrigin(0.5);
    this.report({ step: 'loading' });
    Promise.all(session.profiles.map((p) => Promise.all([loadProgress(p.id), loadPlayLog(p.id)]).then(([progress, log]) => [p.id, progress, log]))).then((entries) => {
      if (!this.sys.isActive()) return;
      entries.forEach(([id, progress, log]) => {
        this.progressById[id] = progress;
        this.logsById[id] = log;
      });
      this.drawTabs();
      this.show();
    });
  }

  layout() {
    const v = this.view;
    this.bg.setPosition(v.x, v.y).setSize(v.width, v.height);
  }

  // ---- tabs: each child, the settings, and the export ----
  drawTabs() {
    this.tabs.forEach((tab) => tab.destroy());
    const items = [...session.profiles.map((p) => ({ id: p.id, label: `${p.avatar} ${p.name}` })), { id: 'settings', label: t('parents.settingsTab') }];
    const width = Math.min(200, 820 / items.length - 10);
    this.tabs = items.map(({ id, label }, i) => {
      const on = id === this.tab;
      const tab = new Button(this, 60 + width / 2 + i * (width + 10), 155, { label, width, height: 60, fontSize: 22, radius: 18, color: on ? COLORS.primary : COLORS.white, textColor: on ? COLORS.white : COLORS.ink, onTap: () => this.pickTab(id) });
      this.tag(`tab:${id}`, tab.box);
      return tab;
    });
    if (session.profiles.length) {
      const exportButton = new Button(this, 1080, 155, { label: t('parents.export'), width: 340, height: 60, fontSize: 20, radius: 18, color: COLORS.white, textColor: COLORS.ink, onTap: () => this.exportAll() });
      this.tag('export', exportButton.box);
      this.tabs.push(exportButton);
    }
  }

  pickTab(id) {
    this.tab = id;
    this.page = 'menu';
    this.showingReport = false;
    this.drawTabs();
    this.show();
  }

  clear() {
    this.content.forEach((object) => object.destroy());
    this.content = [];
  }

  // Keeps an object for the next redraw to remove.
  keep(object) {
    this.content.push(object);
    return object;
  }

  text(x, y, value, size = 22, color = COLORS.ink, extra = {}) {
    return this.keep(this.add.text(x, y, value, textStyle(size, color, { align: 'left', ...extra })).setOrigin(0, 0.5));
  }

  button(name, x, y, label, onTap, { width = 260, height = 56, color = COLORS.white, textColor = COLORS.ink, fontSize = 20 } = {}) {
    const button = this.keep(new Button(this, x, y, { label, width, height, fontSize, radius: 16, color, textColor, onTap }));
    this.tag(name, button.box);
    return button;
  }

  show() {
    this.clear();
    if (!session.profiles.length && this.tab !== 'settings') {
      this.text(LEFT, TOP + 40, t('parents.noPlayers'), 26);
      return;
    }
    if (this.tab === 'settings') this.showSettings();
    else if (this.showingReport) this.showReport(this.child());
    else this.showChild(this.child());
  }

  child() {
    return session.profiles.find((p) => p.id === this.tab);
  }

  // ---- one child ----
  showChild(profile) {
    const band = profileBand(profile);
    const progress = this.progressById[profile.id] || {};
    const days = session.playTime[profile.id];
    const limit = dailyLimitFor(profile);
    const allowed = allowedMinutes(profile, this.today);
    const played = minutesPlayed(days, this.today);

    this.keep(glyph(this, LEFT + 30, TOP + 25, profile.avatar, 56));
    this.text(LEFT + 75, TOP + 8, profile.name, 30);
    this.text(LEFT + 75, TOP + 44, t('parents.band', { emoji: band.emoji, band: bandName(band), age: profile.age }), 20, colorOf(band.color));
    this.text(LEFT + 480, TOP + 25, t('parents.stickers', { count: (profile.stickers || []).length }), 24);

    this.text(LEFT, TOP + 95, t('parents.today'), 22, COLORS.gray);
    this.text(LEFT, TOP + 128, allowed === null ? t('parents.playedNoLimit', { played }) : t('parents.played', { played, allowed }), 24);
    if (allowed !== null) this.button('more-time', LEFT + 440, TOP + 128, t('parents.moreTime', { minutes: BONUS_MINUTES }), () => this.moreTime(profile), { width: 260 });

    // The last 7 days of play.
    const week = recentDays(days, this.today);
    const top = Math.max(limit || 0, ...week.map((d) => d.minutes), 1);
    const weekday = new Intl.DateTimeFormat(getLanguage(), { weekday: 'short', timeZone: 'UTC' });
    week.forEach(({ day, minutes }, i) => {
      const x = LEFT + 30 + i * 78;
      const bottom = TOP + 270;
      const height = Math.max(3, (minutes / top) * BAR_HEIGHT);
      this.keep(this.add.rectangle(x, bottom, 40, BAR_HEIGHT, 0xe6e9f5).setOrigin(0.5, 1).setRounded(6));
      this.keep(this.add.rectangle(x, bottom, 40, height, limit > 0 && minutes > limit ? COLORS.orange : COLORS.primary).setOrigin(0.5, 1).setRounded(6));
      if (minutes) this.keep(this.add.text(x, bottom - height - 14, String(minutes), textStyle(16, COLORS.gray)).setOrigin(0.5));
      const [y, m, d] = day.split('-').map(Number);
      this.keep(this.add.text(x, bottom + 18, weekday.format(new Date(Date.UTC(y, m - 1, d))), textStyle(16, day === this.today ? COLORS.primary : COLORS.gray)).setOrigin(0.5));
    });
    const weekDays = week.map((d) => d.day);
    const adventures = (profile.adventureDays || []).filter((day) => weekDays.includes(day)).length;
    this.text(LEFT, TOP + 320, t('parents.adventures', { count: adventures }), 20);

    // The daily limit.
    this.text(LEFT, TOP + 362, t('parents.limit'), 22, COLORS.gray);
    LIMIT_OPTIONS.forEach((minutes, i) => {
      const on = minutes === limit;
      this.button(`limit:${minutes}`, LEFT + 40 + i * 82, TOP + 400, minutes ? t('parents.limitMinutes', { minutes }) : t('parents.limitOff'), () => this.change(profile, { dailyLimit: minutes }), { width: 74, height: 50, color: on ? COLORS.primary : COLORS.white, textColor: on ? COLORS.white : COLORS.ink });
    });
    this.text(LEFT, TOP + 445, t('parents.limitHint', { name: profile.name }), 17, COLORS.gray, { wordWrap: { width: 560 } });
    this.text(LEFT, TOP + 487, t('parents.readAloud'), 22);
    const narration = profile.narration !== false;
    this.button('narration', LEFT + 300, TOP + 487, t(narration ? 'parents.on' : 'parents.off'), () => this.change(profile, { narration: !narration }), { width: 160 });
    // Progress in their band, by subject.
    const skills = skillsFor({ band: band.id }).filter(isPlayable);
    this.text(RIGHT, TOP + 8, t('parents.progress', { min: band.minAge, max: band.maxAge }), 22, COLORS.gray);
    const subjects = {};
    SUBJECTS.forEach((subject, i) => {
      const own = skills.filter((skill) => skill.subject === subject.id);
      if (!own.length) return;
      const passed = own.filter((skill) => hasPassed(getRecord(progress, skill.id))).length;
      const mastered = own.filter((skill) => isMastered(getRecord(progress, skill.id))).length;
      subjects[subject.id] = { passed, mastered, total: own.length };
      const y = TOP + 55 + i * 46;
      this.text(RIGHT, y, `${subject.emoji} ${subjectName(subject)}`, 20);
      this.keep(this.add.rectangle(RIGHT + 210, y, 260, 18, 0xe6e9f5).setOrigin(0, 0.5).setRounded(9));
      if (passed) this.keep(this.add.rectangle(RIGHT + 210, y, (260 * passed) / own.length, 18, colorOf(subject.light)).setOrigin(0, 0.5).setRounded(9));
      if (mastered) this.keep(this.add.rectangle(RIGHT + 210, y, (260 * mastered) / own.length, 18, colorOf(subject.color)).setOrigin(0, 0.5).setRounded(9));
      this.text(RIGHT + 485, y, `${mastered}/${own.length}`, 20);
    });
    this.text(RIGHT, TOP + 290, t('parents.progressHint'), 16, COLORS.gray, { wordWrap: { width: 540 } });
    const practicing = skills.filter((skill) => {
      const record = getRecord(progress, skill.id);
      return record.attempts > 0 && !hasPassed(record);
    });
    if (practicing.length) {
      const names = practicing.slice(0, 3).map((skill) => `${skill.emoji} ${skillTitle(skill)}`).join(', ');
      this.text(RIGHT, TOP + 335, t('parents.practicing', { skills: names }), 18, COLORS.ink, { wordWrap: { width: 540 } });
    }
    this.button('report', RIGHT + 270, TOP + 470, t('parents.report'), () => this.openReport(), { width: 360, height: 60, fontSize: 24, color: COLORS.primary, textColor: COLORS.white });

    this.report({
      step: 'child',
      child: profile.name,
      played,
      allowed,
      limit,
      narration,
      language: profile.language || FALLBACK,
      week: week.map((d) => d.minutes),
      adventures,
      subjects,
      practicing: practicing.map((skill) => skill.id),
    });
  }

  async change(profile, patch) {
    const before = getLanguage();
    await updateProfileById(profile.id, patch);
    // The signed-in child's language is the dashboard's too: draw it again.
    if (getLanguage() !== before) this.swap(ParentDashboardScene.key, { tab: this.tab, page: this.page });
    else this.show();
  }

  async moreTime(profile) {
    await grantMoreTime(profile.id);
    this.show();
  }

  // ---- the play-test report ----
  openReport() {
    this.showingReport = true;
    this.show();
  }

  showReport(profile) {
    const log = this.logsById[profile.id] || [];
    const rows = skillReport(log);
    const count = (type) => log.filter((e) => e.type === type).length;
    const together = log.filter((e) => e.type === 'answer' && e.coach).length;
    this.button('back-to-child', LEFT + 80, TOP + 5, t('parents.backToChild'), () => this.pickTab(profile.id), { width: 160, height: 50 });
    const parts = { days: daysPlayed(log), answers: count('answer'), rounds: count('round'), quits: count('quit'), levels: log.filter((e) => e.type === 'level' && e.change !== 'hint').length, together };
    const summary = Object.entries(parts)
      .filter(([key, value]) => key !== 'together' || value)
      .map(([key, value]) => t(`parents.summary.${key}`, { count: value }))
      .join(' · ');
    this.text(LEFT + 180, TOP + 5, summary, 19, COLORS.ink, { wordWrap: { width: 980 } });

    const columns = [
      ['skill', LEFT],
      ['tries', LEFT + 430],
      ['right', LEFT + 520],
      ['time', LEFT + 610],
      ['replays', LEFT + 700],
    ];
    if (!rows.length) {
      this.text(LEFT, TOP + 70, t('parents.empty'), 22, COLORS.gray);
    } else {
      columns.forEach(([key, x]) => this.text(x, TOP + 55, t(`parents.columns.${key}`), 18, COLORS.gray));
      rows.slice(0, REPORT_ROWS).forEach((row, i) => {
        const y = TOP + 90 + i * 34;
        const percent = row.accuracy === null ? '–' : `${Math.round(row.accuracy * 100)}%`;
        const seconds = row.medianMs === null ? '–' : `${(row.medianMs / 1000).toFixed(1)}s`;
        const cells = [row.skill ? `${row.skill.emoji} ${skillTitle(row.skill)}` : row.skillId, String(row.attempts), percent, seconds, row.answers ? row.replaysPerAnswer.toFixed(1) : '–'];
        cells.forEach((value, c) => this.text(columns[c][1], y, value, 18));
        const extra = [...row.flags.map((flag) => t(`parents.flags.${flag}`)), row.stepsDown ? `⬇️ ${row.stepsDown}` : '', row.stepsUp ? `⚡ ${row.stepsUp}` : ''].filter(Boolean).join(' · ');
        if (extra) this.text(LEFT + 790, y, extra, 16, COLORS.orange);
      });
      this.text(LEFT, TOP + 105 + REPORT_ROWS * 34, t('parents.legend'), 14, COLORS.gray, { wordWrap: { width: 1150 } });
    }

    // Session notes: the latest few, and a field to add one.
    const notes = notesOf(log);
    this.text(LEFT, TOP + 375, t('parents.notes'), 20, COLORS.gray);
    notes.slice(-2).forEach((note, i) => this.text(LEFT + 200, TOP + 375 + i * 28, `${note.day}: ${note.text}`, 17));
    const field = this.keep(this.add.dom(LEFT + 360, TOP + 445, 'input', `width: 720px; height: 50px; box-sizing: border-box; border: 3px solid #4A6FE3; border-radius: 14px; padding: 0 14px; font: 600 20px ${FONT}; color: #2D3142; background: #fff; outline: none;`));
    Object.assign(field.node, { type: 'text', placeholder: t('parents.notePlaceholder'), maxLength: 200, autocomplete: 'off' });
    field.node.setAttribute('aria-label', t('parents.notes'));
    field.node.addEventListener('keydown', (event) => event.key === 'Enter' && this.addNote(profile, field.node.value));
    this.noteField = field.node;
    this.button('add-note', LEFT + 800, TOP + 445, t('parents.addNote'), () => this.addNote(profile, field.node.value), { width: 120, height: 50, color: COLORS.primary, textColor: COLORS.white });
    this.button('clear-log', LEFT + 1040, TOP + 445, t('parents.clear'), () => this.confirmClear(profile), { width: 260, height: 50, textColor: COLORS.red, fontSize: 18 });
    this.report({ step: 'report', child: profile.name, rows: rows.map((r) => ({ skillId: r.skillId, attempts: r.attempts, flags: r.flags })), notes: notes.map((n) => n.text), together });
  }

  async addNote(profile, text) {
    const note = (text || '').trim();
    if (!note) return;
    await appendPlayLog(profile.id, [{ type: 'note', at: Date.now(), day: this.today, text: note }]);
    this.logsById[profile.id] = await loadPlayLog(profile.id);
    this.show();
  }

  confirmClear(profile) {
    const dialog = new Dialog(this, { width: 600, height: 300, title: t('parents.clearAsk') });
    const yes = new Button(this, -130, 60, { label: t('parents.clearYes'), width: 220, height: 80, color: COLORS.red, onTap: async () => {
      dialog.destroy();
      await clearPlayLog(profile.id);
      this.logsById[profile.id] = [];
      this.show();
    } });
    const no = new Button(this, 130, 60, { label: t('parents.clearNo'), width: 220, height: 80, color: COLORS.gray, onTap: () => dialog.destroy() });
    dialog.add([yes, no]);
    this.tag('clear-yes', yes.box);
    this.tag('clear-no', no.box);
  }

  // ---- settings: a menu of pages ----
  showSettings() {
    if (this.page === 'language') return this.showLanguages();
    if (this.page === 'voice') return this.showVoices();
    this.text(LEFT, TOP + 10, t('parents.settingsTitle'), 26);
    [['language', 'parents.menuLanguage'], ['voice', 'parents.menuVoice']].forEach(([page, key], i) => {
      this.button(`settings:${page}`, LEFT + 230, TOP + 90 + i * 90, t(key), () => this.openPage(page), { width: 460, height: 72, fontSize: 26 });
    });
    this.report({ step: 'settings', page: 'menu' });
  }

  openPage(page) {
    this.page = page;
    this.show();
  }

  // The page's title, with a way back to the settings menu.
  pageTitle(key) {
    this.button('settings:back', LEFT + 80, TOP + 10, t('parents.backToSettings'), () => this.openPage('menu'), { width: 160, height: 50 });
    this.text(LEFT + 190, TOP + 10, t(key), 26);
  }

  // ---- each child's language: text and voice (the same, for now) ----
  showLanguages() {
    this.pageTitle('parents.languageTitle');
    this.text(LEFT, TOP + 65, t('parents.languageIntro'), 18, COLORS.gray, { wordWrap: { width: 1150 } });
    this.text(LEFT + 330, TOP + 115, t('parents.textLanguage'), 20, COLORS.gray);
    this.text(LEFT + 720, TOP + 115, t('parents.voiceLanguage'), 20, COLORS.gray);
    session.profiles.forEach((profile, row) => {
      const y = TOP + 170 + row * 70;
      const language = profile.language || FALLBACK;
      this.text(LEFT, y, `${profile.avatar} ${profile.name}`, 24);
      languages().forEach((option, i) => {
        const on = option.id === language;
        this.button(`language:${profile.id}:${option.id}`, LEFT + 410 + i * 170, y, option.name, () => this.change(profile, { language: option.id }), { width: 160, height: 54, color: on ? COLORS.primary : COLORS.white, textColor: on ? COLORS.white : COLORS.ink });
      });
      // The voice speaks the text's language until a separate voice language comes.
      this.text(LEFT + 720, y, t('parents.sameAsText', { language: languages().find((l) => l.id === language).name }), 20, COLORS.gray);
    });
    this.report({ step: 'settings', page: 'language', languages: Object.fromEntries(session.profiles.map((p) => [p.id, p.language || FALLBACK])) });
  }

  // ---- the read-aloud voice ----
  showVoices() {
    this.pageTitle('parents.voiceTitle');
    const looking = this.text(LEFT, TOP + 60, t('parents.lookingForVoices'), 20, COLORS.gray);
    listVoices().then((voices) => {
      if (!this.sys.isActive() || this.tab !== 'settings' || this.page !== 'voice') return;
      looking.setText('');
      if (!voices.length) {
        looking.setText(t('parents.noVoices'));
        return;
      }
      const choice = voiceChoice();
      const rows = [{ id: null, label: t('parents.automaticBest', { name: voices[0].name }) }, ...voices.slice(0, MAX_VOICES).map((v) => ({ id: v.identifier, label: `${v.name}  ${v.language}${isOnlineVoice(v) ? t('parents.online') : ''}` }))];
      rows.forEach(({ id, label }, i) => {
        const on = id === choice;
        const x = LEFT + 290 + (i % 2) * 600;
        const y = TOP + 70 + Math.floor(i / 2) * 58;
        const row = this.button(`voice:${i}`, x, y, `${on ? '✓' : '▶'}  ${label}`, () => this.pickVoice(id), { width: 580, height: 50, fontSize: 18, color: on ? 0xdce6ff : COLORS.white });
        row.label.setWordWrapWidth(560);
      });
      const y = TOP + 80 + Math.ceil(rows.length / 2) * 58;
      const name = currentVoiceName();
      this.text(LEFT, y, name ? t('parents.nowUsing', { name }) : t('parents.defaultVoice'), 20);
      this.text(LEFT, y + 60, t('parents.voiceNote'), 16, COLORS.gray, { wordWrap: { width: 1150 } });
      this.report({ step: 'voice', voices: rows.map((r) => r.id), choice });
    });
  }

  async pickVoice(id) {
    await chooseVoice(id);
    speak(t('parents.sample'), { force: true });
    this.show();
  }

  exportAll() {
    const csv = toCsv(session.profiles.map((p) => ({ profile: p.name, events: this.logsById[p.id] || [] })));
    exportTextFile(`mathplay-playtest-${this.today}.csv`, csv);
    this.report({ exported: csv.split('\n').length - 1 });
  }
}
