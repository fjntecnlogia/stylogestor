import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Alert, Linking, Modal, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useCallback, useState } from 'react'
import { useRouter, useFocusEffect } from 'expo-router'
import { listClientes, addCliente, type Cliente } from '../../lib/clientes'

export default function ClientesScreen() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  // Modal de novo cliente
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    const list = await listClientes()
    setClientes(list)
  }, [])

  useFocusEffect(useCallback(() => { reload() }, [reload]))

  const handleWhatsApp = async (phone: string, clientName: string) => {
    const digits = phone.replace(/\D/g, '')
    if (!digits) {
      Alert.alert('Telefone', 'Esse cliente não tem telefone cadastrado.')
      return
    }
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

  // Máscara visual (11) 99999-9999
  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d.length ? `(${d}` : ''
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  const handleSaveNew = async () => {
    const name = newName.trim()
    const phoneDigits = newPhone.replace(/\D/g, '')
    if (!name) {
      Alert.alert('Atenção', 'Informe o nome do cliente.')
      return
    }
    if (phoneDigits && phoneDigits.length < 10) {
      Alert.alert('Atenção', 'Telefone incompleto. Use DDD + número (10 ou 11 dígitos).')
      return
    }
    setSaving(true)
    try {
      await addCliente({ name, phone: newPhone })
      setNewName('')
      setNewPhone('')
      setShowNew(false)
      reload()
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o cliente.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = clientes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search),
  )

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Clientes</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowNew(true)}>
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
        keyExtractor={(c) => c.id}
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
                <Text style={s.avatarText}>{c.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={s.info}>
                <View style={s.nameRow}>
                  <Text style={s.name}>{c.name}</Text>
                  {c.tags?.map((t) => (
                    <View key={t} style={s.tag}>
                      <Text style={s.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
                <Text style={s.phone}>{c.phone || 'sem telefone'}</Text>
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
                      <Text style={s.statValue}>{c.lastVisit || '—'}</Text>
                      <Text style={s.statLabel}>Última visita</Text>
                    </View>
                  </View>
                )}
                {isSelected && (
                  <View style={s.actions}>
                    <TouchableOpacity
                      style={[s.actionBtn, { backgroundColor: '#1A3A6B' }]}
                      onPress={() => router.push('/novo-agendamento')}
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
            <Text style={s.emptySub}>Toque em "+ Novo" pra cadastrar.</Text>
          </View>
        }
      />

      {/* Modal Novo Cliente */}
      <Modal visible={showNew} animationType="slide" transparent onRequestClose={() => setShowNew(false)}>
        <KeyboardAvoidingView
          style={s.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Novo cliente</Text>

            <Text style={s.modalLabel}>Nome</Text>
            <TextInput
              style={s.modalInput}
              value={newName}
              onChangeText={(t) => setNewName(t.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
              placeholder="Nome completo"
              placeholderTextColor="#9CA3AF"
              autoFocus
              maxLength={60}
            />

            <Text style={s.modalLabel}>Telefone (opcional)</Text>
            <TextInput
              style={s.modalInput}
              value={newPhone}
              onChangeText={(t) => setNewPhone(formatPhone(t))}
              placeholder="(11) 99999-9999"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={15}
            />

            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnCancel]}
                onPress={() => {
                  setNewName('')
                  setNewPhone('')
                  setShowNew(false)
                }}
              >
                <Text style={s.modalBtnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnSave, saving && { opacity: 0.6 }]}
                onPress={handleSaveNew}
                disabled={saving}
              >
                <Text style={s.modalBtnTextSave}>{saving ? 'Salvando...' : 'Salvar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
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
  emptySub: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB',
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 12 },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 12, marginBottom: 6 },
  modalInput: {
    backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#F3F4F6' },
  modalBtnSave: { backgroundColor: '#1A3A6B' },
  modalBtnTextCancel: { color: '#374151', fontWeight: '700' },
  modalBtnTextSave: { color: '#fff', fontWeight: '700' },
})
