// Where a backdrop picture goes so it covers the whole visible area with no
// gaps: scaled up to the larger of the two ratios and centred on the area.
// The safe area keeps its middle, so wider phones and squarer tablets see a
// little more or less of the edges.
//   coverFit({ width: 1280, height: 720 }, { x: -100, y: 0, width: 1480, height: 720 })
export function coverFit(picture, view) {
  const scale = Math.max(view.width / picture.width, view.height / picture.height);
  return { x: view.x + view.width / 2, y: view.y + view.height / 2, scale };
}
