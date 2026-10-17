// Each subject is an "island" on the world map.
export const SUBJECTS = [
  { id: 'math', emoji: '🔢', color: '#4A6FE3', light: '#DCE6FF' },
  { id: 'literacy', emoji: '🔤', color: '#FF6FA8', light: '#FFE1ED' },
  { id: 'science', emoji: '🌿', color: '#22A85B', light: '#D9F7E6' },
  { id: 'logic', emoji: '🧩', color: '#FF9A3D', light: '#FFE9D4' },
  { id: 'sel', emoji: '💛', color: '#C9A100', light: '#FFF4C2' },
];

export function getSubject(subjectId) {
  return SUBJECTS.find((subject) => subject.id === subjectId);
}
