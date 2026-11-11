const base = require('./app.json');

module.exports = () => {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  return {
    ...base.expo,
    ios: { ...base.expo.ios, config: { googleMapsApiKey: key } },
    android: { ...base.expo.android, config: { googleMaps: { apiKey: key } } },
  };
};
