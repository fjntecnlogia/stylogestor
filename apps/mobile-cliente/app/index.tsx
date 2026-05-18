import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Alert } from 'react-native'
import { router } from 'expo-router'
import { useAuth, useUser } from '@clerk/clerk-expo'

// Simula lista de barbearias próximas
const BARBEARIAS = [
  { id: '1', slug: 'joao-barber',   name: 'Barbearia do João',    rating: 4.9, reviews: 128, city: 'São Paulo, SP',    services: 5, nextSlot: '14:00 hoje' },
  { id: '2', slug: 'barber-king',   name: 'Barber King',           rating: 4.7, reviews: 89,  city: 'BH, MG',           services: 8, nextSlot: '15:30 hoje' },
  { id: '3', slug: 'studio-beleza', name: 'Studio Beleza & Cia',  rating: 4.8, reviews: 234, city: 'Curitiba, PR',     services: 12, nextSlot: '09:00 amanhã' },
]

export default function HomeScreen() {
  const { isSignedIn, signOut } = useAuth()
  const { user } = useUser()
  const firstName = user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'você'

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

  return (
    <SafeAreaView style={s.safe}>
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
            <TouchableOpacity style={s.userChip} onPress={handleSignOut}>
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
  safe: { flex: 1, backgroundColor: '#F8F6F2' },
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
  demoBtn: {
    backgroundColor: '#F5A623', margin: 12, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  demoBtnText: { color: '#1A3A6B', fontWeight: '800', fontSize: 15 },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
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
})
