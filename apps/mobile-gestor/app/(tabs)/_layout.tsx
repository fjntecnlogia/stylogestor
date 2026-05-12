import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[s.tab, focused && s.tabActive]}>
      <Text style={s.emoji}>{emoji}</Text>
      <Text style={[s.tabLabel, focused && s.tabLabelActive]}>{label}</Text>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: s.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Dashboard" focused={focused} />,
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
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  tab: { alignItems: 'center', gap: 2, paddingHorizontal: 8, opacity: 0.5 },
  tabActive: { opacity: 1 },
  emoji: { fontSize: 20 },
  tabLabel: { fontSize: 10, color: '#fff', fontWeight: '500' },
  tabLabelActive: { color: '#F5A623', fontWeight: '700' },
})
