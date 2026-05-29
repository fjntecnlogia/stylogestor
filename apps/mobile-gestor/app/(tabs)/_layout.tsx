import { Tabs, Redirect } from 'expo-router'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { bootstrapTenant } from '../../lib/tenant'
import { ApiError } from '../../lib/api'

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[s.tab, focused && s.tabActive]}>
      <Text style={s.emoji}>{emoji}</Text>
      <Text style={[s.tabLabel, focused && s.tabLabelActive]} numberOfLines={1}>{label}</Text>
    </View>
  )
}

// Estados do bootstrap da barbearia (tenant) — ver lib/tenant.ts.
type TenantPhase = 'checking' | 'ready' | 'onboarding' | 'error'

function FullScreenLoader() {
  return (
    <View style={s.center}>
      <ActivityIndicator color="#F5A623" size="large" />
    </View>
  )
}

export default function TabsLayout() {
  const { isLoaded, isSignedIn, signOut } = useAuth()
  const insets = useSafeAreaInsets()

  const [phase, setPhase] = useState<TenantPhase>('checking')
  const [errMsg, setErrMsg] = useState('')
  const [retry, setRetry] = useState(0)

  // Resolve a barbearia ativa logo após a sessão estar logada.
  // É o ponto único por onde TODO fluxo logado passa (cold-start via index e
  // login via (auth)/_layout convergem aqui).
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    let mounted = true
    setPhase('checking')
    bootstrapTenant()
      .then((r) => {
        if (!mounted) return
        setPhase(r.needsOnboarding ? 'onboarding' : 'ready')
      })
      .catch((err) => {
        if (!mounted) return
        if (err instanceof ApiError && err.status === 401) {
          // Sessão expirada — desloga e cai no gate de login.
          signOut()
          return
        }
        setErrMsg(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível conectar. Verifique sua internet.',
        )
        setPhase('error')
      })
    return () => {
      mounted = false
    }
  }, [isLoaded, isSignedIn, retry])

  // Aguarda Supabase hidratar a sessão antes de decidir
  if (!isLoaded) {
    return <FullScreenLoader />
  }

  // Bloqueia acesso direto via deeplink se nao estiver autenticado
  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />
  }

  // Usuário sem barbearia → onboarding (cria a barbearia e volta pras tabs).
  if (phase === 'onboarding') {
    return <Redirect href="/onboarding" />
  }

  // Resolvendo a barbearia ativa.
  if (phase === 'checking') {
    return <FullScreenLoader />
  }

  // Falha de rede/API ao resolver a barbearia → permite tentar de novo ou sair.
  if (phase === 'error') {
    return (
      <View style={[s.center, { padding: 32 }]}>
        <Text style={s.errEmoji}>📡</Text>
        <Text style={s.errTitle}>Não foi possível carregar</Text>
        <Text style={s.errMsg}>{errMsg}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => setRetry((n) => n + 1)}>
          <Text style={s.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.logoutBtn} onPress={() => signOut()}>
          <Text style={s.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    )
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A3A6B' },
  errEmoji: { fontSize: 44, marginBottom: 12 },
  errTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  errMsg: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  retryBtn: { backgroundColor: '#F5A623', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 32, marginTop: 24 },
  retryText: { color: '#1A3A6B', fontWeight: '800', fontSize: 15 },
  logoutBtn: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 20 },
  logoutText: { color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 13 },
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
