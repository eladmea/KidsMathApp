// Extends app.json. When EXPO_BASE_URL is set (the GitHub Pages deploy sets it
// to "/KidsMathApp"), the web build loads its files from that sub-path.
// Local `npx expo start` leaves it unset, so nothing changes for development.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL || '',
  },
});
