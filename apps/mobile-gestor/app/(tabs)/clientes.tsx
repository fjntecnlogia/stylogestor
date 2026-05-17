import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, Alert, Linking } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

const CLIENTS = [
  { id: '1', name: 'Carlos Oliveira', phone: '(11) 99999-0001', visits: 12, spent: 720,  lastVisit: '08/05', tags: ['vip'] },
  { id: '2', name: 'Rafael Santos',   phone: '(11) 99999-0002', visits: 5,  spent: 200,  lastVisit: '05/05', tags: [] },
  { id: '3', name: 'Pedro Alves',     phone: '(11) 99999-0003', visits: 23, spent: 1380, lastVisit: '09/05', tags: ['vip', 'mensal'] },
  { id: '4', name: 'Lucas Ferreira',  phone: '(11) 99999-0004', visits: 3,  spent: 120,  lastVisit: '01/05', tags: [] },
  { id: '5', name: 'André Lima',      phone: '(11) 99999-0005', visits: 8,  spent: 480,  lastVisit: '07/05', tags: ['mensal'] },
  { id: '6', name: 'Bruno Carvalho',  phone: '(11) 99999-0006', visits: 1,  spent: 40,   lastVisit: '02/05', tags: [] },
]

export default function ClientesScreen() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const handleWhatsApp = async (phone: string, clientName: string) => {
    const digits = phone.replace(/\D/g, '')
    const msg = encodeURIComponent(`Oi ${clientName.split(' ')[0]}! Tudo bem? ✂️`)
    const appUrl = `whatsapp://send?phone=55${digits}&text=${msg}`
    const webUrl = `https://wa.me/55${digits}?text=${msg}`
    try {
      const supported = await Linking.canOpenURL(appUrl)
      await Linking.openURL(supported ? appUrl : webUrl)
    } catch {
      Alert.alert('WhatsApp', 'Não foi possível abrir o WhatsApp.')
    }
  }

  const filtered = CLIENTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Clientes</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => Alert.alert('Novo cliente', 'Cadastro de cliente em desenvolvimento. Use o painel web por ora.')}
        >
          <Text style={s.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchBar}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nome ou telefone..."
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={c => c.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: c }) => {
          const isSelected = selected === c.id
          return (
            <TouchableOpacity
              style={[s.card, isSelected && s.cardSelected]}
              onPress={() => setSelected(isSelected ? null : c.id)}
            >
              <View style={s.avatar}>
                <Text style={s.avatarText}>{c.name.charAt(0)}</Text>
              </View>
              <View style={s.info}>
                <View style={s.nameRow}>
                  <Text style={s.name}>{c.name}</Text>
                  {c.tags.map(t => (
                    <View key={t} style={s.tag}>
                      <Text style={s.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
                <Text style={s.phone}>{c.phone}</Text>
                {isSelected && (
                  <View style={s.stats}>
                    <View style={s.statItem}>
                      <Text style={s.statValue}>{c.visits}</Text>
                      <Text style={s.statLabel}>Visitas</Text>
                    </View>
                    <View style={s.statItem}>
                      <Text style={[s.statValue, { color: '#1B8A5A' }]}>R${c.spent}</Text>
                      <Text style={s.statLabel}>Total gasto</Text>
                    </View>
                    <View style={s.statItem}>
                      <Text style={s.statValue}>{c.lastVisit}</Text>
                      <Text style={s.statLabel}>Última visita</Text>
                    </View>
                  </View>
                )}
                {isSelected && (
                  <View style={s.actions}>
                    <TouchableOpacity
                      style={[s.actionBtn, { backgroundColor: '#1A3A6B' }]}
                      onPress={() => router.push('/(tabs)/agenda')}
                    >
                      <Text style={s.actionBtnText}>📅 Agendar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.actionBtn, { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' }]}
                      onPress={() => handleWhatsApp(c.phone, c.name)}
                    >
                      <Text style={[s.actionBtnText, { color: '#374151' }]}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>👥</Text>
            <Text style={s.emptyText}>Nenhum cliente encontrado</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F6F2' },
  header: {
    backgroundColor: '#1A3A6B', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  addBtn: { backgroundColor: '#F5A623', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  addBtnText: { color: '#1A3A6B', fontWeight: '700', fontSize: 13 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 12, marginTop: 12, borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#111827' },
  list: { padding: 12, gap: 8 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    flexDirection: 'row', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardSelected: { borderWidth: 1.5, borderColor: '#1A3A6B' },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#1A3A6B',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  tag: { backgroundColor: '#FEF9C3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  phone: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  stats: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#6B7280', fontWeight: '600', marginTop: 12 },
})
