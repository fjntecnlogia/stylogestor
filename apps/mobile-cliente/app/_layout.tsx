import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#1A3A6B" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}
