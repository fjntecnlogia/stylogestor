const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Adiciona polyfill que corrige console.error non-writable ANTES do @expo/metro-runtime.
// Sem isto: Invariant Violation "Module not registered as callable" -> app crasha
// na inicializacao com so AppRegistry registrado (JSTimers, RCTDeviceEventEmitter
// falham porque setUpBatchedBridge depende de console.error writable).
config.serializer = {
  ...config.serializer,
  polyfillModuleNames: [
    path.join(__dirname, 'polyfill-fix.js'),
    ...(config.serializer?.polyfillModuleNames || []),
  ],
};

// PATCH: força UMA copia de react e react-native no bundle.
// pnpm cria multiplas copias com peer deps diferentes que causam
// "Cannot read property 'useMemo' of null" (multiplas instancias do React).
const reactNativeRoot = path.join(__dirname, 'node_modules', 'react-native');
const reactRoot = path.join(__dirname, 'node_modules', 'react');
const reactDomRoot = path.join(__dirname, 'node_modules', 'react-dom');

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === 'react' || moduleName.startsWith('react/')) {
      const suffix = moduleName === 'react' ? '' : moduleName.slice('react'.length);
      return { filePath: require.resolve(path.join(reactRoot, suffix)), type: 'sourceFile' };
    }
    if (moduleName === 'react-dom' || moduleName.startsWith('react-dom/')) {
      const suffix = moduleName === 'react-dom' ? '' : moduleName.slice('react-dom'.length);
      try {
        return { filePath: require.resolve(path.join(reactDomRoot, suffix)), type: 'sourceFile' };
      } catch (e) {
        return context.resolveRequest(context, moduleName, platform);
      }
    }
    if (moduleName === 'react-native' || moduleName.startsWith('react-native/')) {
      const suffix = moduleName === 'react-native' ? '' : moduleName.slice('react-native'.length);
      try {
        return { filePath: require.resolve(path.join(reactNativeRoot, suffix)), type: 'sourceFile' };
      } catch (e) {
        return context.resolveRequest(context, moduleName, platform);
      }
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Excluir artefatos volateis dos outros apps Next.js do file map do Metro.
// Sem isto, .next/static/* (gerado/destruido em hot-reload pelo Next.js)
// causa ENOENT no FallbackWatcher do Windows.
config.resolver.blockList = [
  /[\\\/]\.next[\\\/].*/,
  /[\\\/]\.turbo[\\\/].*/,
  /[\\\/]apps[\\\/]web[\\\/]\.next[\\\/].*/,
  /[\\\/]apps[\\\/]admin[\\\/]\.next[\\\/].*/,
  /[\\\/]apps[\\\/]booking[\\\/]\.next[\\\/].*/,
  /[\\\/]apps[\\\/]site[\\\/]\.next[\\\/].*/,
  /[\\\/]apps[\\\/]mobile-cliente[\\\/].*/,
];

module.exports = config;
