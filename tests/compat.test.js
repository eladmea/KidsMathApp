// Guards for older phone browsers. The build rewrites new syntax for them,
// but not regex lookbehind: one `(?<=` or `(?<!` anywhere stops Safari before
// iOS 16.4 from loading the game at all (a blank page).
import fs from 'fs';
import path from 'path';

function sources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return full.endsWith('.js') ? [full] : [];
  });
}

describe('older browser support', () => {
  it('uses no regex lookbehind in the game code', () => {
    const offenders = sources('src').filter((file) => /\(\?<[=!]/.test(fs.readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
