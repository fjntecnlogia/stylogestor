import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth, useUser } from '../lib/auth'
import Constants from 'expo-constants'

// Simula lista de barbearias próximas
const BARBEARIAS = [
  { id: '1', slug: 'joao-barber',   name: 'Barbearia do João',    rating: 4.9, reviews: 128, city: 'São Paulo, SP',    services: 5, nextSlot: '14:00 hoje' },
  { id: '2', slug: 'barber-king',   name: 'Barber King',           rating: 4.7, reviews: 89,  city: 'BH, MG',           services: 8, nextSlot: '15:30 hoje' },
  { id: '3', slug: 'studio-beleza', name: 'Studio Beleza & Cia',  rating: 4.8, reviews: 234, city: 'Curitiba, PR',     services: 12, nextSlot: '09:00 amanhã' },
]

export default function HomeScreen() {
  const { isSignedIn, signOut } = useAuth()
  const { user } = useUser()
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>
  const fullName = (meta.name as string | undefined) || (meta.firstName as string | undefined) || ''
  const firstName = fullName.split(' ')[0] || user?.email?.split('@')[0] || 'você'

  const handleSignOut = () => {
    Alert.alert('Sair da conta', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try { await signOut() } catch (_) {}
        },
      },
    ])
  }

  // edges={['top']} aplica padding-top conforme insets do dispositivo (notch, status bar, etc).
  // Sem isto, o header colorido (azul) cola na status bar e fica embaixo dos icones
  // de bateria/rede em Xiaomi/MIUI.
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={s.logoRow}>
            <View style={s.logoBox}>
              <Text style={s.logoLetter}>S</Text>
            </View>
            <Text style={s.logoText}>STYLO<Text style={s.logoAccent}>GESTOR</Text></Text>
          </View>

          {/* Auth corner: Entrar (anonimo) ou avatar (logado) */}
          {isSignedIn ? (
            <TouchableOpacity style={s.userChip} onPress={() => router.push('/meu-perfil')}>
              <View style={s.userAvatar}>
                <Text style={s.userAvatarText}>{firstName.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={s.userName} numberOfLines={1}>Oi, {firstName}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.loginBtn} onPress={() => router.push('/(auth)/login')}>
              <Text style={s.loginBtnText}>Entrar</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={s.subtitle}>Agende na sua barbearia favorita</Text>
      </View>

      {/* Atalhos rápidos pro usuario logado */}
      {isSignedIn && (
        <View style={s.quickRow}>
          <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/meus-agendamentos')}>
            <Text style={s.quickEmoji}>📅</Text>
            <Text style={s.quickText}>Meus agendamentos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/meu-perfil')}>
            <Text style={s.quickEmoji}>👤</Text>
            <Text style={s.quickText}>Meu perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.quickBtn, { borderColor: '#FEE2E2' }]} onPress={handleSignOut}>
            <Text style={s.quickEmoji}>🚪</Text>
            <Text style={[s.quickText, { color: '#991B1B' }]}>Sair</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Demo direto */}
      <TouchableOpacity
        style={s.demoBtn}
        onPress={() => router.push('/agendar/demo')}
      >
        <Text style={s.demoBtnText}>⚡ Agendar na barbearia demo</Text>
      </TouchableOpacity>

      <FlatList
        data={BARBEARIAS}
        keyExtractor={b => b.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={s.listTitle}>Barbearias disponíveis</Text>}
        ListFooterComponent={
          <Text style={s.version}>
            Agendar STYLOGESTOR v{Constants.expoConfig?.version ?? '1.0.0'} ({Constants.expoConfig?.android?.versionCode ?? '?'})
          </Text>
        }
        renderItem={({ item: b }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => router.push(`/agendar/${b.slug}`)}
          >
            <View style={s.cardAvatar}>
              <Text style={s.cardAvatarText}>{b.name.charAt(0)}</Text>
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardName}>{b.name}</Text>
              <Text style={s.cardCity}>📍 {b.city}</Text>
              <View style={s.cardMeta}>
                <Text style={s.cardRating}>⭐ {b.rating} ({b.reviews})</Text>
                <Text style={s.cardServices}>✂️ {b.services} serviços</Text>
              </View>
            </View>
            <View style={s.cardRight}>
              <Text style={s.cardSlot}>{b.nextSlot}</Text>
              <Text style={s.cardArrow}>›</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
  header: { backgroundColor: '#1A3A6B', padding: 20, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginBtn: { backgroundColor: 'rgba(245,166,35,0.15)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#F5A623' },
  loginBtnText: { color: '#F5A623', fontWeight: '700', fontSize: 13 },
  userChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, maxWidth: 160 },
  userAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: '#1A3A6B', fontWeight: '900', fontSize: 13 },
  userName: { color: '#fff', fontSize: 12, fontWeight: '600' },
  logoBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5A623',
    alignItems: 'center', justifyContent: 'center',
  },
  logoLetter: { color: '#1A3A6B', fontWeight: '900', fontSize: 20 },
  logoText: { color: '#fff', fontWeight: '900', fontSize: 20 },
  logoAccent: { color: '#F5A623' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  quickRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 12,
    backgroundColor: '#F8F6F2',
  },
  quickBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  quickEmoji: { fontSize: 22 },
  quickText: { fontSize: 11, fontWeight: '600', color: '#1A3A6B', marginTop: 4, textAlign: 'center' },
  demoBtn: {
    backgroundColor: '#F5A623', margin: 12, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  demoBtnText: { color: '#1A3A6B', fontWeight: '800', fontSize: 15 },
  list: { paddingHorizontal: 12, paddingBottom: 24, backgroundColor: '#F8F6F2' },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#1A3A6B',
    alignItems: 'center', justifyContent: 'center',
  },
  cardAvatarText: { color: '#fff', fontWeight: '900', fontSize: 24 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardCity: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardMeta: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cardRating: { fontSize: 11, color: '#374151', fontWeight: '600' },
  cardServices: { fontSize: 11, color: '#374151', fontWeight: '600' },
  cardRight: { alignItems: 'flex-end' },
  cardSlot: { fontSize: 11, color: '#1B8A5A', fontWeight: '700', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  cardArrow: { fontSize: 22, color: '#9CA3AF', marginTop: 4 },
  version: { textAlign: 'center', color: '#9CA3AF', fontSize: 11, marginTop: 24, marginBottom: 8 },
})
