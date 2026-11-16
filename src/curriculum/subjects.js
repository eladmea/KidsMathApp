// Each subject is an "island" on the world map. An `open` island shows all
// its skills to every age band, with no locks (the child's age sets how hard
// each game is instead): Kitchen Cove.
export const SUBJECTS = [
  { id: 'math', emoji: '🔢', color: '#4A6FE3', light: '#DCE6FF' },
  { id: 'literacy', emoji: '🔤', color: '#FF6FA8', light: '#FFE1ED' },
  { id: 'science', emoji: '🌿', color: '#22A85B', light: '#D9F7E6' },
  { id: 'logic', emoji: '🧩', color: '#FF9A3D', light: '#FFE9D4' },
  { id: 'sel', emoji: '💛', color: '#C9A100', light: '#FFF4C2' },
  { id: 'kitchen', emoji: '🍳', color: '#E8613C', light: '#FFE3D6', open: true },
];

export function getSubject(subjectId) {
  return SUBJECTS.find((subject) => subject.id === subjectId);
}

export const isOpenSubject = (subjectId) => Boolean(getSubject(subjectId) && getSubject(subjectId).open);
