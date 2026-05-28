// Exclui expo-notifications do autolinker nativo do React Native.
// Mesma estrategia do mobile-gestor: a v0.32.x do expo-notifications
// foi compilada esperando API mais nova de expo-modules-core que a
// 3.0.30 do SDK 54, causando InstantiationError(AsyncFunctionComponent)
// ao boot. O cliente nao usa notifications, entao excluir resolve.
module.exports = {
  dependencies: {
    'expo-notifications': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
}
