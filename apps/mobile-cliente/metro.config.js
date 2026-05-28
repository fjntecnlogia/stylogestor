const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const metroResolver = require('metro-resolver');

const config = getDefaultConfig(__dirname);

// Polyfill que corrige console.error non-writable ANTES do @expo/metro-runtime.
config.serializer = {
  ...config.serializer,
  polyfillModuleNames: [
    path.join(__dirname, 'polyfill-fix.js'),
    ...(config.serializer?.polyfillModuleNames || []),
  ],
};

// Mesma estrategia do mobile-gestor: forca singleton de modulos nativos
// + react. Sem isso, deps com peer ranges conflitantes geram nesteds que
// quebram bundle (useMemo of null, RNSScreen duplicado, etc).
const SINGLETON_MODULES = new Set([
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-native',
  'react-native-screens',
  'react-native-safe-area-context',
  'react-native-svg',
]);

config.resolver = {
  ...config.resolver,
  blockList: [
    /[\\\/]\.next[\\\/].*/,
    /[\\\/]\.turbo[\\\/].*/,
    /[\\\/]apps[\\\/]web[\\\/]\.next[\\\/].*/,
    /[\\\/]apps[\\\/]admin[\\\/]\.next[\\\/].*/,
    /[\\\/]apps[\\\/]booking[\\\/]\.next[\\\/].*/,
    /[\\\/]apps[\\\/]site[\\\/]\.next[\\\/].*/,
    /[\\\/]apps[\\\/]mobile-gestor[\\\/].*/,
  ],
  resolveRequest: (context, moduleName, platform) => {
    if (SINGLETON_MODULES.has(moduleName)) {
      try {
        const target = require.resolve(moduleName, {
          paths: [path.join(__dirname, 'node_modules')],
        });
        return { filePath: target, type: 'sourceFile' };
      } catch (e) {
        // fallback
      }
    }
    // Default Metro resolver sem recursao
    return metroResolver.resolve(
      { ...context, resolveRequest: undefined },
      moduleName,
      platform,
    );
  },
};

module.exports = config;
