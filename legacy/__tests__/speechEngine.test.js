import { AppState } from 'react-native';
import * as Speech from 'expo-speech';
import { fallbackVoice, isOnlineVoice, rankVoice, splitSentences } from '../utils/voices';

jest.mock('expo-speech', () => ({
  getAvailableVoicesAsync: jest.fn(),
  speak: jest.fn(),
  stop: jest.fn(),
}));
jest.mock('../utils/storage', () => ({
  loadVoiceChoice: jest.fn(() => Promise.resolve(null)),
  saveVoiceChoice: jest.fn(() => Promise.resolve()),
}));

const storage = require('../utils/storage');
const VOICES = [
  { identifier: 'fred', name: 'Fred', language: 'en-US', quality: 'Default' },
  { identifier: 'aria', name: 'Microsoft Aria Online (Natural) - English (United States)', language: 'en-US', quality: 'Default', localService: false },
  { identifier: 'com.apple.voice.premium.en-US.Ava', name: 'Ava (Premium)', language: 'en-US', quality: 'Enhanced', localService: true },
  { identifier: 'com.apple.voice.compact.en-US.Samantha', name: 'Samantha', language: 'en-US', quality: 'Default', localService: true },
];

let engine;
let appStateHandler;

beforeEach(() => {
  jest.clearAllMocks();
  Speech.getAvailableVoicesAsync.mockResolvedValue(VOICES);
  storage.loadVoiceChoice.mockResolvedValue(null);
  jest.spyOn(AppState, 'addEventListener').mockImplementation((event, handler) => {
    appStateHandler = handler;
    return { remove: jest.fn() };
  });
  jest.isolateModules(() => {
    engine = require('../utils/speechEngine');
  });
});

afterEach(() => engine.resetSpeechForTests());

describe('voice ranking', () => {
  it('knows online voices and Apple and Android tiers', () => {
    expect(isOnlineVoice(VOICES[1])).toBe(true);
    expect(isOnlineVoice({ identifier: 'en-us-x-iob-network' })).toBe(true);
    expect(isOnlineVoice({ identifier: 'en-us-x-tpf-local' })).toBe(false);
    expect(rankVoice(VOICES[2])).toBeGreaterThan(rankVoice(VOICES[3]));
    const android = { identifier: 'en-us-x-tpf-local', name: 'en-us-x-tpf-local', language: 'en-US', quality: 'Default' };
    expect(rankVoice(android)).toBeGreaterThan(rankVoice(VOICES[3]));
    expect(rankVoice({ identifier: 'com.apple.eloquence.en-US.Eddy', name: 'Eddy', language: 'en-US' })).toBeLessThan(0);
  });

  it('prefers on-device voices when offline, and falls back to them', () => {
    expect(rankVoice(VOICES[1], { online: true })).toBeGreaterThan(rankVoice(VOICES[2], { online: true }));
    expect(rankVoice(VOICES[1], { online: false })).toBeLessThan(rankVoice(VOICES[2], { online: false }));
    expect(fallbackVoice(VOICES, ['aria'])).toBe('com.apple.voice.premium.en-US.Ava');
    expect(fallbackVoice([VOICES[1]], ['aria'])).toBeNull();
  });

  it('splits long text into sentences and long sentences at commas', () => {
    expect(splitSentences('Hi Mia! Pick an island. Ready?')).toEqual(['Hi Mia!', 'Pick an island.', 'Ready?']);
    const long = `${'one, '.repeat(60)}done.`;
    const parts = splitSentences(long, 100);
    expect(parts.length).toBeGreaterThan(1);
    parts.forEach((part) => expect(part.length).toBeLessThanOrEqual(100));
    expect(parts.join(' ')).toBe(long);
  });
});

describe('speech engine', () => {
  it('picks the best voice on start and reports it', async () => {
    await engine.initSpeech();
    expect(engine.getStatus()).toMatchObject({ ready: true, voiceId: 'aria', isOnlineVoice: true });
    expect(engine.getStatus().voiceName).toMatch(/Aria/);
  });

  it('ignores a saved voice this device does not have', async () => {
    storage.loadVoiceChoice.mockResolvedValue('voice-from-another-browser');
    await engine.initSpeech();
    expect(engine.getStatus().voiceId).toBe('aria');
  });

  it('keeps a saved voice the device does have', async () => {
    storage.loadVoiceChoice.mockResolvedValue('com.apple.voice.compact.en-US.Samantha');
    await engine.initSpeech();
    expect(engine.getStatus().voiceId).toBe('com.apple.voice.compact.en-US.Samantha');
  });

  it('queues each sentence with the chosen voice at natural pitch', async () => {
    await engine.initSpeech();
    engine.speak('Hi Mia! Pick an island.');
    expect(Speech.stop).toHaveBeenCalled();
    expect(Speech.speak.mock.calls.map(([text]) => text)).toEqual(['Hi Mia!', 'Pick an island.']);
    Speech.speak.mock.calls.forEach(([, options]) => {
      expect(options).toMatchObject({ voice: 'aria', pitch: 1, language: 'en-US' });
    });
    const [[, first], [, last]] = Speech.speak.mock.calls;
    first.onStart();
    expect(engine.getStatus().speaking).toBe(true);
    last.onDone();
    expect(engine.getStatus().speaking).toBe(false);
  });

  it('waits for the voice before the very first sentence', async () => {
    engine.speak('Hello!');
    expect(Speech.speak).not.toHaveBeenCalled();
    await engine.initSpeech();
    await Promise.resolve();
    expect(Speech.speak).toHaveBeenCalledWith('Hello!', expect.objectContaining({ voice: 'aria' }));
  });

  it('retries once with an on-device voice when a voice fails', async () => {
    await engine.initSpeech();
    engine.speak('One. Two.');
    const [, options] = Speech.speak.mock.calls[1];
    Speech.speak.mockClear();
    options.onError(new Error('network'));
    expect(Speech.speak.mock.calls.map(([text, o]) => [text, o.voice])).toEqual([['Two.', 'com.apple.voice.premium.en-US.Ava']]);
    expect(engine.getStatus().voiceId).toBe('com.apple.voice.premium.en-US.Ava');
    // A second failure gives up and reports it.
    Speech.speak.mock.calls[0][1].onError(new Error('again'));
    expect(engine.getStatus()).toMatchObject({ speaking: false, error: 'speak' });
  });

  it('ignores callbacks from speech that was replaced or stopped', async () => {
    await engine.initSpeech();
    engine.speak('Old.');
    const [, oldOptions] = Speech.speak.mock.calls[0];
    engine.speak('New.');
    oldOptions.onStart();
    oldOptions.onError(new Error('interrupted'));
    expect(engine.getStatus()).toMatchObject({ speaking: false, error: null });
    engine.stop();
    expect(Speech.stop).toHaveBeenCalledTimes(3);
  });

  it('stops talking when the app goes to the background', async () => {
    await engine.initSpeech();
    engine.speak('Hello.');
    Speech.speak.mock.calls[0][1].onStart();
    appStateHandler('background');
    expect(engine.getStatus().speaking).toBe(false);
    expect(Speech.stop).toHaveBeenCalledTimes(2);
  });

  it('notifies subscribers and saves a grown-up choice', async () => {
    await engine.initSpeech();
    const listener = jest.fn();
    const unsubscribe = engine.subscribe(listener);
    await engine.chooseVoice('com.apple.voice.compact.en-US.Samantha');
    expect(listener).toHaveBeenCalled();
    expect(storage.saveVoiceChoice).toHaveBeenCalledWith('com.apple.voice.compact.en-US.Samantha');
    expect(engine.getStatus().choice).toBe('com.apple.voice.compact.en-US.Samantha');
    await engine.chooseVoice(null);
    expect(engine.getStatus().voiceId).toBe('aria');
    unsubscribe();
  });

  it('copes with a device that lists no voices', async () => {
    Speech.getAvailableVoicesAsync.mockResolvedValue([]);
    await engine.initSpeech();
    engine.speak('Hello.');
    expect(Speech.speak).toHaveBeenCalledWith('Hello.', expect.not.objectContaining({ voice: expect.anything() }));
  });
});
