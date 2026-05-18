/**
 * Polyfill para corrigir o problema de console.error não-writable.
 *
 * O @expo/metro-runtime define console.error como non-writable para
 * proteção contra mutação de argumentos pelo React DevTools.
 * Isso quebra o ExceptionsManager do React Native que tenta fazer:
 *   console.error = errorHandler (falha silenciosamente)
 *
 * Resultado: setUpBatchedBridge falha → JSTimers não registrado → black screen
 *
 * Fix: restaurar console.error como writable ANTES de qualquer código de setup.
 */
(function() {
  try {
    var descriptor = Object.getOwnPropertyDescriptor(console, 'error');
    if (descriptor && !descriptor.writable) {
      Object.defineProperty(console, 'error', {
        writable: true,
        configurable: true,
        enumerable: descriptor.enumerable,
        value: descriptor.value || descriptor.get && descriptor.get(),
      });
    }
  } catch (e) {
    // Ignorar se falhar
  }
})();
