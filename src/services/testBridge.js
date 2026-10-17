// A window hook for browser tests (Playwright can't read text drawn on a
// canvas). Scenes report what they show, and tag the objects a test needs to
// tap or drag; `window.__mathplay` then answers:
//   scene            the active scene's key
//   state            what that scene reports (its step, the question, ...)
//   spoken           every line read aloud
//   voice            each sentence and how it was voiced: { text, source:
//                    'recording' | 'device' }
//   box(name)        a tagged object's box in page pixels { x, y, width, height }
//   names()          all tagged names in the active scene
//   toPage(x, y)     a point in game coordinates -> page pixels
export const bridge = {
  game: null,
  scene: null,
  state: {},
  spoken: [],
  voice: [],
  tags: new Map(),
};

function toPage(x, y) {
  const { game } = bridge;
  const scene = bridge.scene && game.scene.getScene(bridge.scene);
  const camera = scene.cameras.main;
  const rect = game.canvas.getBoundingClientRect();
  const scale = rect.width / game.scale.width;
  return { x: rect.left + (x - camera.worldView.x) * scale, y: rect.top + (y - camera.worldView.y) * scale };
}

export function installBridge(game) {
  bridge.game = game;
  window.__mathplay = {
    get scene() {
      return bridge.scene;
    },
    get state() {
      return bridge.state;
    },
    spoken: bridge.spoken,
    voice: bridge.voice,
    names: () => [...bridge.tags.keys()],
    toPage,
    box(name) {
      const object = bridge.tags.get(name);
      if (!object || !object.active) return null;
      const bounds = object.getBounds();
      const topLeft = toPage(bounds.x, bounds.y);
      const bottomRight = toPage(bounds.right, bounds.bottom);
      return { x: topLeft.x, y: topLeft.y, width: bottomRight.x - topLeft.x, height: bottomRight.y - topLeft.y };
    },
  };
}

// Called by BaseScene when a scene starts.
export function reportScene(key) {
  bridge.scene = key;
  bridge.state = {};
  bridge.tags.clear();
}

export function reportState(patch) {
  bridge.state = { ...bridge.state, ...patch };
}

export function tag(name, object) {
  bridge.tags.set(name, object);
  return object;
}
