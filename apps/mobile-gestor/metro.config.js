const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Polyfill que corrige console.error non-writable ANTES do @expo/metro-runtime.
// Sem isto: setUpBatchedBridge falha -> JSTimers nao registrado -> black screen.
config.serializer = {
  ...config.serializer,
  polyfillModuleNames: [
    path.join(__dirname, 'polyfill-fix.js'),
    ...(config.serializer?.polyfillModuleNames || []),
  ],
};

// Exclui artefatos volateis de outros apps Next.js do file map.
// Sem isto, .next/static/* (hot-reload do Next.js no monorepo) causa
// ENOENT no FallbackWatcher do Windows.
config.resolver = {
  ...config.resolver,
  blockList: [
    /[\\\/]\.next[\\\/].*/,
    /[\\\/]\.turbo[\\\/].*/,
    /[\\\/]apps[\\\/]web[\\\/]\.next[\\\/].*/,
    /[\\\/]apps[\\\/]admin[\\\/]\.next[\\\/].*/,
    /[\\\/]apps[\\\/]booking[\\\/]\.next[\\\/].*/,
    /[\\\/]apps[\\\/]site[\\\/]\.next[\\\/].*/,
    /[\\\/]apps[\\\/]mobile-cliente[\\\/].*/,
  ],
};

// Sem dedup resolver custom: layout flat (.npmrc node-linker=hoisted)
// ja garante que cada app tem suas deps no proprio node_modules direto.

module.exports = config;
