import Button from './Button';
import Dialog from './Dialog';
import { glyph } from './Art';
import { COLORS, textStyle } from './theme';
import { tag } from '../services/testBridge';
import { speak } from '../services/speech';
import { completeAdventureStep } from '../services/session';
import { t } from '../i18n/index';

// The card at the end of a mini-game: a picture, a headline, a line, and a
// button (back to learning by default). Played as a step of Today's
// Adventure (data.adventureStep), the button also marks the step done.
//   showGameEnd(scene, { emoji, headline, detail, label, onDone, say })
// `say` is what is read aloud (the headline and line by default).
async function finishStep(scene) {
  const { adventureStep } = scene.startData;
  if (adventureStep) await completeAdventureStep(adventureStep);
  scene.back();
}

export function showGameEnd(scene, { emoji, headline, detail = '', label = t('mini.backToLearning'), onDone = () => finishStep(scene), say = [headline, detail].filter(Boolean).join(' ') }) {
  const dialog = new Dialog(scene, { width: 640, height: 440, title: headline });
  dialog.add(glyph(scene, 0, -60, emoji, 90));
  if (detail) dialog.add(scene.add.text(0, 40, detail, textStyle(24, COLORS.ink, { wordWrap: { width: 540 } })).setOrigin(0.5));
  const done = new Button(scene, 0, 150, { label, width: 360, height: 84, fontSize: 30, color: COLORS.primary, onTap: onDone });
  dialog.add(done);
  tag('done', done.box);
  speak(say, { force: true });
  return dialog;
}
