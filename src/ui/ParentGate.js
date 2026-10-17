import Button from './Button';
import Dialog from './Dialog';
import { COLORS, textStyle } from './theme';
import { checkGate, makeGateQuestion } from '../logic/parentGate';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
const MAX_DIGITS = 3;

// "Grown-ups only": type the answer to a times fact on the keypad to go on.
// A wrong answer gets a new question. ✕ cancels.
//   openParentGate(scene, { onPass, onCancel })
export function openParentGate(scene, { title = 'Grown-ups only', onPass = () => {}, onCancel = () => {} } = {}) {
  let question = makeGateQuestion();
  let input = '';
  const dialog = new Dialog(scene, { width: 760, height: 560, title: `🔒 ${title}` });
  const note = scene.add.text(-200, -170, 'Please ask a grown-up:', textStyle(26, COLORS.gray)).setOrigin(0.5);
  const asked = scene.add.text(-200, -90, '', textStyle(64)).setOrigin(0.5);
  const display = scene.add.rectangle(-200, 10, 260, 90, 0xf2f2f2).setRounded(20).setStrokeStyle(4, COLORS.gray);
  const typed = scene.add.text(-200, 10, '', textStyle(56)).setOrigin(0.5);
  const wrong = scene.add.text(-200, 100, '', textStyle(24, COLORS.red)).setOrigin(0.5);
  dialog.add([note, asked, display, typed, wrong]);
  const show = () => {
    asked.setText(`${question.text} = ?`);
    typed.setText(input);
  };

  KEYS.forEach((key, i) => {
    const x = 120 + (i % 3) * 110;
    const y = -150 + Math.floor(i / 3) * 100;
    const button = new Button(scene, x, y, {
      label: key,
      width: 96,
      height: 86,
      fontSize: 38,
      color: key === '✓' ? COLORS.green : COLORS.white,
      textColor: key === '✓' ? COLORS.white : COLORS.ink,
      onTap: () => press(key),
    });
    button.box.setStrokeStyle(3, 0xdddddd);
    dialog.add(button);
    scene.tag(`key:${key}`, button.box);
  });
  const cancel = new Button(scene, 330, -235, { label: '✕', width: 70, height: 70, fontSize: 34, color: COLORS.white, textColor: COLORS.ink, onTap: () => {
    dialog.close();
    onCancel();
  } });
  dialog.add(cancel);
  scene.tag('gate-cancel', cancel.box);

  function press(key) {
    wrong.setText('');
    display.setStrokeStyle(4, COLORS.gray);
    if (key === '⌫') {
      input = input.slice(0, -1);
    } else if (key === '✓') {
      if (checkGate(question, input)) {
        dialog.close();
        onPass();
        return;
      }
      wrong.setText("Not quite. Here's a new one.");
      display.setStrokeStyle(4, COLORS.red);
      input = '';
      question = makeGateQuestion();
    } else if (input.length < MAX_DIGITS) {
      input += key;
    }
    show();
    scene.report({ gate: question.text, gateAnswer: question.answer, gateInput: input, gateWrong: wrong.text !== '' });
  }

  show();
  scene.report({ gate: question.text, gateAnswer: question.answer, gateInput: '' });
  return dialog;
}
