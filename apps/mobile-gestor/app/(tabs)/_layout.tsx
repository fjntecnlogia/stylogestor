import { Tabs, Redirect } from 'expo-router'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../lib/auth'

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[s.tab, focused && s.tabActive]}>
      <Text style={s.emoji}>{emoji}</Text>
      <Text style={[s.tabLabel, focused && s.tabLabelActive]} numberOfLines={1}>{label}</Text>
    </View>
  )
}

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const insets = useSafeAreaInsets()

  // Aguarda Supabase hidratar a sessão antes de decidir
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A3A6B' }}>
        <ActivityIndicator color="#F5A623" size="large" />
      </View>
    )
  }

  // Bloqueia acesso direto via deeplink se nao estiver autenticado
  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />
  }

  // Tab bar respeitando o safe area inferior (gestural nav bar / botoes do Android).
  // Sem isto, em Xiaomi/MIUI a tab bar fica colada no rodape e dificulta o toque.
  const tabBarPaddingBottom = Math.max(insets.bottom, 8)
  const tabBarHeight = 60 + tabBarPaddingBottom

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [s.tabBar, { height: tabBarHeight, paddingBottom: tabBarPaddingBottom }],
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Início" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="Agenda" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Clientes" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="financeiro"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" label="Financeiro" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="Mais" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const s = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1A3A6B',
    borderTopWidth: 0,
    paddingTop: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  tab: { alignItems: 'center', gap: 2, paddingHorizontal: 4, opacity: 0.5, minWidth: 55, maxWidth: 70 },
  tabActive: { opacity: 1 },
  emoji: { fontSize: 20 },
  tabLabel: { fontSize: 10, color: '#fff', fontWeight: '500', textAlign: 'center' },
  tabLabelActive: { color: '#F5A623', fontWeight: '700' },
})
