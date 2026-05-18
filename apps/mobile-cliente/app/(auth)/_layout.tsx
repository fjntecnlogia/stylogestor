import { Stack } from 'expo-router'

// Sem guard: app cliente e hibrido, usuario logado pode reabrir telas
// de auth se quiser (caso queira mudar conta). Nao redireciona como o gestor.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
