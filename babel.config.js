module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],  // NativeWind config ở đây (không dùng plugins)
    ],
    plugins: [
      'react-native-worklets/plugin', // 👈 plugin mới cho Reanimated >= 3.10
    ],
  };
};