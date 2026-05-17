import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Redirect } from 'expo-router'
import * as SecureStore from 'expo-secure-store'

export default function Index() {
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    SecureStore.getItemAsync('user_logged_in')
      .then((val) => {
        setIsLoggedIn(val === 'true')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A3A6B' }}>
        <ActivityIndicator color="#F5A623" size="large" />
      </View>
    )
  }

  return <Redirect href={isLoggedIn ? '/(tabs)' : '/(auth)/login'} />
}
