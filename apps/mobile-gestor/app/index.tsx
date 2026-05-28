import { View, ActivityIndicator } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuth } from '../lib/auth'

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A3A6B' }}>
        <ActivityIndicator color="#F5A623" size="large" />
      </View>
    )
  }

  return <Redirect href={isSignedIn ? '/(tabs)' : '/(auth)/login'} />
}
