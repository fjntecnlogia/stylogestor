const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const metroResolver = require('metro-resolver');

const config = getDefaultConfig(__dirname);

// Modulos que DEVEM ser singleton no bundle. Sem isso, deps que declaram
// peer ranges incompativeis (ex: @clerk/shared pede react ~19.1.4||~19.2.3)
// fazem pnpm criar nested copies que duplicam views/hooks em runtime:
//   - "Tried to register two views with the same name RNSScreen"
//   - "Cannot read property 'useMemo' of null"
//
// Forçamos resolucao em apps/mobile-gestor/node_modules. Como esse dir
// é hoisted (.npmrc node-linker=hoisted), na pratica resolve para o root.
const SINGLETON_MODULES = new Set([
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-native',
  'react-native-screens',
  'react-native-safe-area-context',
  'react-native-svg',
]);

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
  // Resolver custom usando metro-resolver direto (sem recursao):
  // forca SINGLETON_MODULES a sempre resolverem na raiz do projeto.
  resolveRequest: (context, moduleName, platform) => {
    if (SINGLETON_MODULES.has(moduleName)) {
      try {
        const target = require.resolve(moduleName, {
          paths: [path.join(__dirname, 'node_modules')],
        });
        return { filePath: target, type: 'sourceFile' };
      } catch (e) {
        // Fall through ao default se require.resolve falhar
      }
    }
    // Default Metro resolver - metro-resolver direto (nao recursao do context)
    return metroResolver.resolve(
      { ...context, resolveRequest: undefined },
      moduleName,
      platform,
    );
  },
};

module.exports = config;
