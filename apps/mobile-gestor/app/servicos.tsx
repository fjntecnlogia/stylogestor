import { useCallback, useState } from 'react'
import {
  ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, Modal, KeyboardAvoidingView, Platform, Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { loadArray, saveArray, newId } from '../lib/storage'

type Servico = {
  id: string
  nome: string
  duracao: number
  preco: number
  categoria: string
  ativo: boolean
}

const KEY = 'servicos_v1'

const CATEGORIAS = ['Corte', 'Barba', 'Combo', 'Pigmentação', 'Sobrancelha', 'Outros']

const SEED: Servico[] = [
  { id: 'sv_1', nome: 'Corte masculino',  duracao: 30, preco: 40, categoria: 'Corte', ativo: true },
  { id: 'sv_2', nome: 'Barba',            duracao: 30, preco: 30, categoria: 'Barba', ativo: true },
  { id: 'sv_3', nome: 'Corte + Barba',    duracao: 45, preco: 60, categoria: 'Combo', ativo: true },
  { id: 'sv_4', nome: 'Pigmentação',      duracao: 60, preco: 80, categoria: 'Pigmentação', ativo: true },
]

export default function ServicosScreen() {
  const router = useRouter()
  const [servicos, setServicos] = useState<Servico[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Servico | null>(null)

  // Form state
  const [form, setForm] = useState<Omit<Servico, 'id' | 'ativo'>>({
    nome: '', duracao: 30, preco: 0, categoria: 'Corte',
  })

  const load = useCallback(async () => {
    let list = await loadArray<Servico>(KEY)
    if (list.length === 0) {
      // Primeira execucao: popula com seed pra usuario nao ver tela vazia
      list = SEED
      await saveArray(KEY, list)
    }
    setServicos(list)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const openNew = () => {
    setEditing(null)
    setForm({ nome: '', duracao: 30, preco: 0, categoria: 'Corte' })
    setModalOpen(true)
  }

  const openEdit = (sv: Servico) => {
    setEditing(sv)
    setForm({ nome: sv.nome, duracao: sv.duracao, preco: sv.preco, categoria: sv.categoria })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nome.trim()) {
      Alert.alert('Atenção', 'Nome do serviço é obrigatório.')
      return
    }
    if (form.preco <= 0) {
      Alert.alert('Atenção', 'Preço deve ser maior que zero.')
      return
    }
    if (form.duracao <= 0) {
      Alert.alert('Atenção', 'Duração deve ser maior que zero.')
      return
    }

    let updated: Servico[]
    if (editing) {
      updated = servicos.map((s) => (s.id === editing.id ? { ...s, ...form } : s))
    } else {
      updated = [{ id: newId('sv'), ...form, ativo: true }, ...servicos]
    }
    await saveArray(KEY, updated)
    setServicos(updated)
    setModalOpen(false)
  }

  const handleToggleAtivo = async (sv: Servico) => {
    const updated = servicos.map((s) => (s.id === sv.id ? { ...s, ativo: !s.ativo } : s))
    await saveArray(KEY, updated)
    setServicos(updated)
  }

  const handleDelete = (sv: Servico) => {
    Alert.alert('Remover serviço?', `"${sv.nome}" não estará mais disponível para agendamento.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          const updated = servicos.filter((s) => s.id !== sv.id)
          await saveArray(KEY, updated)
          setServicos(updated)
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
        <Text style={s.headerTitle}>Serviços</Text>
        <TouchableOpacity style={s.addBtn} onPress={openNew}>
          <Text style={s.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll}>
        {servicos.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>✂️</Text>
            <Text style={s.emptyTitle}>Sem serviços cadastrados</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={openNew}>
              <Text style={s.emptyBtnText}>+ Cadastrar primeiro serviço</Text>
            </TouchableOpacity>
          </View>
        ) : servicos.map((sv) => (
          <View key={sv.id} style={[s.card, !sv.ativo && { opacity: 0.55 }]}>
            <TouchableOpacity style={s.cardMain} onPress={() => openEdit(sv)}>
              <View style={{ flex: 1 }}>
                <View style={s.cardTopRow}>
                  <Text style={s.cardName}>{sv.nome}</Text>
                  {!sv.ativo && <Text style={s.inactiveBadge}>inativo</Text>}
                </View>
                <Text style={s.cardMeta}>
                  {sv.categoria} · {sv.duracao} min
                </Text>
              </View>
              <Text style={s.cardPrice}>R$ {sv.preco}</Text>
            </TouchableOpacity>
            <View style={s.cardActions}>
              <Switch
                value={sv.ativo}
                onValueChange={() => handleToggleAtivo(sv)}
                trackColor={{ false: '#E5E7EB', true: '#1A3A6B' }}
                thumbColor={sv.ativo ? '#F5A623' : '#fff'}
              />
              <TouchableOpacity onPress={() => handleDelete(sv)}>
                <Text style={s.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Modal de edição/criação */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.modalOverlay}
        >
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Text style={s.modalClose}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>{editing ? 'Editar serviço' : 'Novo serviço'}</Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={s.modalSave}>Salvar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalBody}>
              <Text style={s.label}>Nome *</Text>
              <TextInput
                style={s.input}
                value={form.nome}
                onChangeText={(v) => setForm((f) => ({ ...f, nome: v }))}
                placeholder="Ex: Corte degradê"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={s.label}>Categoria</Text>
              <View style={s.catRow}>
                {CATEGORIAS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[s.catChip, form.categoria === c && s.catChipActive]}
                    onPress={() => setForm((f) => ({ ...f, categoria: c }))}
                  >
                    <Text style={[s.catChipText, form.categoria === c && s.catChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Duração (min) *</Text>
                  <TextInput
                    style={s.input}
                    value={String(form.duracao)}
                    onChangeText={(v) => setForm((f) => ({ ...f, duracao: Number(v.replace(/\D/g, '')) || 0 }))}
                    keyboardType="number-pad"
                    placeholder="30"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Preço (R$) *</Text>
                  <TextInput
                    style={s.input}
                    value={String(form.preco)}
                    onChangeText={(v) => setForm((f) => ({ ...f, preco: Number(v.replace(/\D/g, '')) || 0 }))}
                    keyboardType="number-pad"
                    placeholder="40"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <Text style={s.previewLabel}>Preview no app cliente:</Text>
              <View style={s.preview}>
                <View style={{ flex: 1 }}>
                  <Text style={s.previewName}>{form.nome || 'Nome do serviço'}</Text>
                  <Text style={s.previewMeta}>⏱ {form.duracao || 0} min · {form.categoria}</Text>
                </View>
                <Text style={s.previewPrice}>R$ {form.preco || 0}</Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
  header: {
    backgroundColor: '#1A3A6B', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
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
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  inactiveBadge: { fontSize: 10, color: '#92400E', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontWeight: '700', textTransform: 'uppercase' },
  cardMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardPrice: { fontSize: 16, fontWeight: '800', color: '#1B8A5A' },
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
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  catChipActive: { borderColor: '#1A3A6B', backgroundColor: '#EFF6FF' },
  catChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  catChipTextActive: { color: '#1A3A6B', fontWeight: '700' },
  row2: { flexDirection: 'row', gap: 10 },
  previewLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', marginTop: 20, letterSpacing: 1 },
  preview: { backgroundColor: '#F8F6F2', borderRadius: 12, padding: 14, marginTop: 6, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#1A3A6B', borderStyle: 'dashed' },
  previewName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  previewMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  previewPrice: { fontSize: 18, fontWeight: '800', color: '#1A3A6B' },
})
