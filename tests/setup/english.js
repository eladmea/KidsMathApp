// The game opens in Hebrew (the default language), but the tests are written
// against the English text, so each test file starts in English. A test that
// needs Hebrew switches with setLanguage('he').
import { setLanguage } from '../../src/i18n/index';

setLanguage('en');
