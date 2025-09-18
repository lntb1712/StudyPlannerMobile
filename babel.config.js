module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],  // NativeWind config ở đây (không dùng plugins)
    ],
    plugins: [
      'react-native-reanimated/plugin',  // Chỉ thêm nếu bạn dùng Reanimated; đặt cuối cùng nếu có nhiều plugins
    ],
  };
};