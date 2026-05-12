import { Redirect } from 'expo-router'

export default function Index() {
  // TODO: verificar sessão real com Clerk
  const isLoggedIn = false
  return <Redirect href={isLoggedIn ? '/(tabs)' : '/(auth)/login'} />
}
