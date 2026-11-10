// SDK 54 shim: @kingstinct/expo-apple-targets (via react-native-device-activity) imports
// @expo/prebuild-config/build/plugins/icons/AssetContents, removed in SDK 54.
// Recreate the single function it needs so the config plugin loads. Runs on every install.
const fs = require("fs");
const path = require("path");
try {
  const dir = path.join(__dirname, "..", "node_modules", "@expo", "prebuild-config", "build", "plugins", "icons");
  const file = path.join(dir, "AssetContents.js");
  if (!fs.existsSync(file)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, [
      '"use strict";',
      'Object.defineProperty(exports, "__esModule", { value: true });',
      'exports.writeContentsJsonAsync = writeContentsJsonAsync;',
      'const fs = require("fs");',
      'const path = require("path");',
      'async function writeContentsJsonAsync(directory, opts) {',
      '  const images = (opts && opts.images) || [];',
      '  await fs.promises.mkdir(directory, { recursive: true });',
      '  await fs.promises.writeFile(path.join(directory, "Contents.json"), JSON.stringify({ images, info: { version: 1, author: "xcode" } }, null, 2));',
      '}',
      ''
    ].join("\n"));
    console.log("[sage] AssetContents shim applied for SDK 54.");
  } else {
    console.log("[sage] AssetContents shim already present.");
  }
} catch (e) {
  console.warn("[sage] AssetContents shim failed:", e.message);
}
