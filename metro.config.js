const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = Array.from(
  new Set([...(config.resolver.sourceExts ?? []), "mjs"]),
);

config.resolver.assetExts = Array.from(
  new Set([...(config.resolver.assetExts ?? []), "tflite"]),
);

module.exports = withNativeWind(config, { input: "./global.css" });
