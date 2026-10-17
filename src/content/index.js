// Question content per language: the words, sentences and word banks the
// question generators use. src/content/<language>/<pack>.js, one pack per
// subject (math, literacy, science, logic, sel). Packs are found
// automatically: a new file is a new pack.
//
// A pack exports its data (word lists, situations, stories), `say` (phrase
// functions, so each language handles its own grammar: plurals, gender,
// word order) and, optionally, `generators` that replace the default ones for
// that language (e.g. a different reading curriculum).
//
// A skill is available in a language only if that language has its pack; the
// game never shows a question in the wrong language.
import { FALLBACK, getLanguage } from '../i18n/index';

const modules = import.meta.glob('./*/*.js', { eager: true });

const packs = {};
Object.entries(modules).forEach(([path, module]) => {
  const [, language, pack] = path.match(/^\.\/([^/]+)\/(.+)\.js$/);
  packs[language] = packs[language] || {};
  packs[language][pack] = module;
});

export function hasContent(pack, language = getLanguage()) {
  return Boolean(packs[language] && packs[language][pack]);
}

// The current language's pack (English if it has none, so nothing crashes).
export function content(pack, language = getLanguage()) {
  return (packs[language] && packs[language][pack]) || (packs[FALLBACK] && packs[FALLBACK][pack]) || {};
}

export function contentLanguages() {
  return Object.keys(packs);
}

export function packsOf(language) {
  return Object.keys(packs[language] || {});
}
