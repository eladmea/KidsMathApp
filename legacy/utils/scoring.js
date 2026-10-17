export function calculateStars(score, total) {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}
