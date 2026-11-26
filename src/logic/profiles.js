import { bandForAge } from '../curriculum/ageBands';

export const AVATARS = ['🦁', '🐸', '🐼', '🦊', '🐯', '🐨', '🐵', '🦄', '🐙', '🐧'];
export const MAX_NAME_LENGTH = 16;

export function createProfile({ name, age, avatar, language = 'en' }, now = Date.now()) {
  const band = bandForAge(age);
  return {
    id: `p_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim().slice(0, MAX_NAME_LENGTH),
    age,
    avatar,
    // The language the game speaks and shows for this child.
    language,
    // Read prompts aloud by default for children who aren't reading yet.
    narration: !band.readsText,
    createdAt: now,
  };
}

export function profileBand(profile) {
  return bandForAge(profile.age);
}

export function isValidName(name) {
  return name.trim().length > 0;
}

// The language "Who's playing?" opens in, before a child is picked: the
// children's language when they all play in one (an all-English family sees
// English), otherwise the game's default. A profile saved before languages
// existed plays in `fallback`.
export function startLanguage(profiles, defaultLanguage, fallback = 'en') {
  const used = [...new Set(profiles.map((profile) => profile.language || fallback))];
  return used.length === 1 ? used[0] : defaultLanguage;
}
