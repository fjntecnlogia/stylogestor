// Exclui expo-notifications do autolinker nativo do React Native.
//
// Justificativa: a v0.32.17 do expo-notifications (que vem hoisted do mobile-cliente)
// foi compilada esperando uma API de expo-modules-core mais nova que a 3.0.30 ship
// no Expo SDK 54. Resultado: InstantiationError(AsyncFunctionComponent) ao boot
// quando o ExpoModulesPackage tenta registrar o BadgeModule.kt nativo.
//
// Como o mobile-gestor não importa expo-notifications no JS (comentado em
// app/_layout.tsx), excluir do autolink nativo é seguro e elimina o crash.
//
// TODO: religar quando expo-modules-core 3.1+ for estável (atualmente só canary).
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
