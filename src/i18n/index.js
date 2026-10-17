// Every word the game shows or says goes through here, so adding a language
// means adding files, not changing code.
//
// Text lives in src/i18n/<language>/<namespace>.json (one namespace per
// feature: map.json, quiz.json, curriculum.json, ...), so features don't share
// files. Each language folder has a _meta.json:
//   { "name": "English", "dir": "ltr", "speech": "en-US" }
// Languages are found automatically: a new folder is a new language. Keys
// missing in a language fall back to English, then to the key itself.
//
//   t('map.greeting', { name: 'Mia' })        "Hi, Mia! Pick an island."
//   t('results.stickers', { count: 2 })       plural forms by language:
//     "stickers": { "one": "New sticker: {list}", "other": "New stickers: {list}" }
const files = import.meta.glob('./*/*.json', { eager: true, import: 'default' });

export const FALLBACK = 'en';

const catalog = {};
Object.entries(files).forEach(([path, data]) => {
  const [, language, file] = path.match(/^\.\/([^/]+)\/(.+)\.json$/);
  catalog[language] = catalog[language] || { meta: {}, text: {} };
  if (file === '_meta') catalog[language].meta = data;
  else catalog[language].text[file] = data;
});

let current = FALLBACK;
const listeners = new Set();

// [{ id, name, dir, speech }], English first.
export function languages() {
  return Object.keys(catalog)
    .sort((a, b) => (a === FALLBACK ? -1 : b === FALLBACK ? 1 : a.localeCompare(b)))
    .map((id) => ({ id, name: id, dir: 'ltr', speech: id, ...catalog[id].meta }));
}

export function hasLanguage(id) {
  return Boolean(catalog[id]);
}

export function getLanguage() {
  return current;
}

export function languageInfo(id = current) {
  return languages().find((language) => language.id === id) || languages()[0];
}

export function isRtl() {
  return languageInfo().dir === 'rtl';
}

export function setLanguage(id) {
  const next = hasLanguage(id) ? id : FALLBACK;
  if (next === current) return;
  current = next;
  listeners.forEach((listener) => listener(current));
}

export function onLanguageChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function lookup(language, key) {
  const [namespace, ...path] = key.split('.');
  let node = catalog[language]?.text[namespace];
  for (const part of path) {
    if (node == null) return undefined;
    node = node[part];
  }
  return node;
}

// The raw value for a key (a string, a plural object, an array...), in the
// current language or English.
export function raw(key, language = current) {
  const value = lookup(language, key);
  return value === undefined && language !== FALLBACK ? lookup(FALLBACK, key) : value;
}

export function has(key) {
  return raw(key) !== undefined;
}

function fill(text, params) {
  return text.replace(/\{(\w+)\}/g, (match, name) => (params[name] === undefined ? match : String(params[name])));
}

export function t(key, params = {}) {
  let value = raw(key);
  if (value === undefined) return key;
  if (typeof value === 'object' && !Array.isArray(value)) {
    const form = typeof params.count === 'number' ? new Intl.PluralRules(current).select(params.count) : 'other';
    value = value[form] ?? value.other;
  }
  return typeof value === 'string' ? fill(value, params) : value;
}

// For tests: every key in a language, as 'namespace.path'.
export function keysOf(language) {
  const out = [];
  const walk = (node, prefix) => {
    if (node && typeof node === 'object' && !Array.isArray(node) && !('other' in node)) {
      Object.entries(node).forEach(([k, v]) => walk(v, prefix ? `${prefix}.${k}` : k));
    } else {
      out.push(prefix);
    }
  };
  Object.entries(catalog[language]?.text || {}).forEach(([namespace, data]) => walk(data, namespace));
  return out;
}

// "cat, dog and fish", the way the current language joins lists.
export function list(items) {
  try {
    return new Intl.ListFormat(current, { style: 'long', type: 'conjunction' }).format(items.map(String));
  } catch (e) {
    return items.join(', ');
  }
}
