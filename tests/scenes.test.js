// Every game a skill opens has a scene that plays it (scenes declare
// `static plays = [...]`; read as text, since scenes need Phaser).
import { readFileSync, readdirSync } from 'fs';
import { SKILLS } from '../src/curriculum/skills';

const dir = new URL('../src/scenes/', import.meta.url);
const sources = readdirSync(dir)
  .filter((file) => file.endsWith('Scene.js'))
  .map((file) => readFileSync(new URL(file, dir), 'utf8'));

describe('scenes', () => {
  it('play every game screen the skills name', () => {
    const played = new Set(sources.flatMap((source) => [...source.matchAll(/static plays = \[([^\]]*)\]/g)].flatMap(([, list]) => [...list.matchAll(/'(\w+)'/g)].map(([, name]) => name))));
    const screens = new Set(SKILLS.filter((skill) => skill.screen).map((skill) => skill.screen));
    expect([...screens].filter((screen) => !played.has(screen))).toEqual([]);
  });

  it('each have a unique key', () => {
    const keys = sources.map((source) => (source.match(/static key = '(\w+)'/) || [])[1]);
    expect(keys.every(Boolean)).toBe(true);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
