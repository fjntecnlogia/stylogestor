import { useCallback, useState } from 'react'
import {
  ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, Modal, KeyboardAvoidingView, Platform, Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { loadArray, saveArray, newId } from '../lib/storage'

type Profissional = {
  id: string
  nome: string
  role: string
  telefone: string
  comissaoPct: number
  ativo: boolean
}

const KEY = 'profissionais_v1'

const ROLES = ['Barbeiro', 'Cabeleireiro', 'Manicure', 'Esteticista', 'Outro']

const SEED: Profissional[] = [
  { id: 'pr_1', nome: 'João Silva',  role: 'Barbeiro',     telefone: '(11) 98765-4321', comissaoPct: 50, ativo: true },
  { id: 'pr_2', nome: 'Pedro Costa', role: 'Cabeleireiro', telefone: '(11) 98765-4322', comissaoPct: 45, ativo: true },
]

function maskPhone(value: string): string {
  let digits = value.replace(/\D/g, '')
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2)
  digits = digits.slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

function onlyLetters(value: string): string {
  return value.replace(/[^\p{L}\s'-]/gu, '')
}

export default function ProfissionaisScreen() {
  const router = useRouter()
  const [profs, setProfs] = useState<Profissional[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Profissional | null>(null)
  const [form, setForm] = useState<Omit<Profissional, 'id' | 'ativo'>>({
    nome: '', role: 'Barbeiro', telefone: '', comissaoPct: 50,
  })

  const load = useCallback(async () => {
    let list = await loadArray<Profissional>(KEY)
    if (list.length === 0) {
      list = SEED
      await saveArray(KEY, list)
    }
    setProfs(list)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const openNew = () => {
    setEditing(null)
    setForm({ nome: '', role: 'Barbeiro', telefone: '', comissaoPct: 50 })
    setModalOpen(true)
  }

  const openEdit = (p: Profissional) => {
    setEditing(p)
    setForm({ nome: p.nome, role: p.role, telefone: p.telefone, comissaoPct: p.comissaoPct })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nome.trim()) {
      Alert.alert('Atenção', 'Nome é obrigatório.')
      return
    }
    let updated: Profissional[]
    if (editing) {
      updated = profs.map((p) => (p.id === editing.id ? { ...p, ...form } : p))
    } else {
      updated = [{ id: newId('pr'), ...form, ativo: true }, ...profs]
    }
    await saveArray(KEY, updated)
    setProfs(updated)
    setModalOpen(false)
  }

  const handleToggleAtivo = async (p: Profissional) => {
    const updated = profs.map((x) => (x.id === p.id ? { ...x, ativo: !x.ativo } : x))
    await saveArray(KEY, updated)
    setProfs(updated)
  }

  const handleDelete = (p: Profissional) => {
    Alert.alert('Remover profissional?', `${p.nome} não estará mais disponível para agendamentos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          const updated = profs.filter((x) => x.id !== p.id)
          await saveArray(KEY, updated)
          setProfs(updated)
        },
      },
    ])
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profissionais</Text>
        <TouchableOpacity style={s.addBtn} onPress={openNew}>
          <Text style={s.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll}>
        {profs.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>✂️</Text>
            <Text style={s.emptyTitle}>Sem profissionais cadastrados</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={openNew}>
              <Text style={s.emptyBtnText}>+ Cadastrar primeiro</Text>
            </TouchableOpacity>
          </View>
        ) : profs.map((p) => (
          <View key={p.id} style={[s.card, !p.ativo && { opacity: 0.55 }]}>
            <TouchableOpacity style={s.cardMain} onPress={() => openEdit(p)}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{p.nome.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.cardTopRow}>
                  <Text style={s.cardName}>{p.nome}</Text>
                  {!p.ativo && <Text style={s.inactiveBadge}>inativo</Text>}
                </View>
                <Text style={s.cardRole}>{p.role}</Text>
                {p.telefone ? <Text style={s.cardPhone}>{p.telefone}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.commissionLabel}>Comissão</Text>
                <Text style={s.commissionValue}>{p.comissaoPct}%</Text>
              </View>
            </TouchableOpacity>
            <View style={s.cardActions}>
              <Switch
                value={p.ativo}
                onValueChange={() => handleToggleAtivo(p)}
                trackColor={{ false: '#E5E7EB', true: '#1A3A6B' }}
                thumbColor={p.ativo ? '#F5A623' : '#fff'}
              />
              <TouchableOpacity onPress={() => handleDelete(p)}>
                <Text style={s.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{ height: 60 }} />
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Text style={s.modalClose}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>{editing ? 'Editar profissional' : 'Novo profissional'}</Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={s.modalSave}>Salvar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalBody}>
              <Text style={s.label}>Nome completo *</Text>
              <TextInput
                style={s.input}
                value={form.nome}
                onChangeText={(v) => setForm((f) => ({ ...f, nome: onlyLetters(v) }))}
                placeholder="Nome do profissional"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />

              <Text style={s.label}>Função</Text>
              <View style={s.roleRow}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[s.roleChip, form.role === r && s.roleChipActive]}
                    onPress={() => setForm((f) => ({ ...f, role: r }))}
                  >
                    <Text style={[s.roleChipText, form.role === r && s.roleChipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Telefone / WhatsApp</Text>
              <TextInput
                style={s.input}
                value={form.telefone}
                onChangeText={(v) => setForm((f) => ({ ...f, telefone: maskPhone(v) }))}
                placeholder="(11) 99999-9999"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={15}
              />

              <Text style={s.label}>Comissão por atendimento (%)</Text>
              <TextInput
                style={s.input}
                value={String(form.comissaoPct)}
                onChangeText={(v) => {
                  const n = Math.min(100, Math.max(0, Number(v.replace(/\D/g, '')) || 0))
                  setForm((f) => ({ ...f, comissaoPct: n }))
                }}
                keyboardType="number-pad"
                placeholder="50"
                placeholderTextColor="#9CA3AF"
                maxLength={3}
              />
              <Text style={s.helpText}>
                Quanto este profissional recebe sobre cada serviço atendido. Exemplo: 50% significa que metade do valor cobrado vai pra ele.
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
  header: { backgroundColor: '#1A3A6B', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { color: '#F5A623', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  addBtn: { backgroundColor: '#F5A623', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  addBtnText: { color: '#1A3A6B', fontWeight: '700', fontSize: 13 },
  scroll: { flex: 1, padding: 12 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 12 },
  emptyBtn: { backgroundColor: '#1A3A6B', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A3A6B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  inactiveBadge: { fontSize: 10, color: '#92400E', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontWeight: '700', textTransform: 'uppercase' },
  cardRole: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardPhone: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  commissionLabel: { fontSize: 10, color: '#6B7280', textTransform: 'uppercase' },
  commissionValue: { fontSize: 16, fontWeight: '800', color: '#1B8A5A' },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  deleteText: { fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 24, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  modalClose: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  modalSave: { color: '#1A3A6B', fontSize: 15, fontWeight: '700' },
  modalBody: { paddingHorizontal: 20, paddingVertical: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  roleChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  roleChipActive: { borderColor: '#1A3A6B', backgroundColor: '#EFF6FF' },
  roleChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  roleChipTextActive: { color: '#1A3A6B', fontWeight: '700' },
  helpText: { fontSize: 11, color: '#6B7280', marginTop: 6, lineHeight: 16 },
})
