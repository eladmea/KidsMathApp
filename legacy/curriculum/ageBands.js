// Age bands drive which skills a child sees first, whether prompts are read
// aloud by default, and (later) how long a session should last.
export const AGE_BANDS = [
  {
    id: 'sprouts',
    label: 'Sprouts',
    emoji: '🌱',
    minAge: 3,
    maxAge: 4,
    color: '#3DDC84',
    readsText: false,
    sessionMinutes: 10,
  },
  {
    id: 'explorers',
    label: 'Explorers',
    emoji: '🧭',
    minAge: 5,
    maxAge: 6,
    color: '#FF9A3D',
    readsText: false,
    sessionMinutes: 15,
  },
  {
    id: 'builders',
    label: 'Builders',
    emoji: '🧱',
    minAge: 7,
    maxAge: 8,
    color: '#4A6FE3',
    readsText: true,
    sessionMinutes: 15,
  },
  {
    id: 'masters',
    label: 'Masters',
    emoji: '🏆',
    minAge: 9,
    maxAge: 10,
    color: '#8E5CE0',
    readsText: true,
    sessionMinutes: 20,
  },
];

export const MIN_AGE = AGE_BANDS[0].minAge;
export const MAX_AGE = AGE_BANDS[AGE_BANDS.length - 1].maxAge;

export function getBand(bandId) {
  return AGE_BANDS.find((band) => band.id === bandId) || AGE_BANDS[0];
}

export function bandForAge(age) {
  const clamped = Math.min(MAX_AGE, Math.max(MIN_AGE, Math.round(age)));
  return AGE_BANDS.find((band) => clamped >= band.minAge && clamped <= band.maxAge);
}
