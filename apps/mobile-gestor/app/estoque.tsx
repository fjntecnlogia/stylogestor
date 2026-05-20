import { useCallback, useState } from 'react'
import {
  ScrollView, View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity,
  Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { loadArray, saveArray, newId } from '../lib/storage'

type Produto = {
  id: string
  nome: string
  categoria: string
  unidade: string
  qtd: number
  qtdMinima: number
  precoCusto: number
  precoVenda: number
}

const KEY = 'estoque_v1'

const CATEGORIAS = ['Cabelo', 'Barba', 'Pele', 'Equipamento', 'Outros']
const UNIDADES = ['un', 'ml', 'g', 'kg', 'L']

const SEED: Produto[] = [
  { id: 'pd_1', nome: 'Pomada modeladora', categoria: 'Cabelo', unidade: 'un', qtd: 15, qtdMinima: 5, precoCusto: 18, precoVenda: 35 },
  { id: 'pd_2', nome: 'Óleo para barba',   categoria: 'Barba',  unidade: 'ml', qtd: 8,  qtdMinima: 3, precoCusto: 22, precoVenda: 45 },
]

export default function EstoqueScreen() {
  const router = useRouter()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Produto | null>(null)
  const [form, setForm] = useState<Omit<Produto, 'id'>>({
    nome: '', categoria: 'Cabelo', unidade: 'un', qtd: 0, qtdMinima: 0, precoCusto: 0, precoVenda: 0,
  })

  const load = useCallback(async () => {
    let list = await loadArray<Produto>(KEY)
    if (list.length === 0) {
      list = SEED
      await saveArray(KEY, list)
    }
    setProdutos(list)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const openNew = () => {
    setEditing(null)
    setForm({ nome: '', categoria: 'Cabelo', unidade: 'un', qtd: 0, qtdMinima: 0, precoCusto: 0, precoVenda: 0 })
    setModalOpen(true)
  }

  const openEdit = (p: Produto) => {
    setEditing(p)
    setForm({ ...p })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.nome.trim()) {
      Alert.alert('Atenção', 'Nome do produto é obrigatório.')
      return
    }
    let updated: Produto[]
    if (editing) {
      updated = produtos.map((p) => (p.id === editing.id ? { ...editing, ...form } : p))
    } else {
      updated = [{ id: newId('pd'), ...form }, ...produtos]
    }
    await saveArray(KEY, updated)
    setProdutos(updated)
    setModalOpen(false)
  }

  const handleDelete = (p: Produto) => {
    Alert.alert('Remover produto?', `"${p.nome}" será apagado do estoque.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          const updated = produtos.filter((x) => x.id !== p.id)
          await saveArray(KEY, updated)
          setProdutos(updated)
        },
      },
    ])
  }

  const total = produtos.reduce((sum, p) => sum + p.qtd * p.precoCusto, 0)
  const baixos = produtos.filter((p) => p.qtd <= p.qtdMinima)

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Estoque</Text>
        <TouchableOpacity style={s.addBtn} onPress={openNew}>
          <Text style={s.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <View style={s.summary}>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Valor total</Text>
          <Text style={s.summaryValue}>R$ {total.toFixed(2).replace('.', ',')}</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Produtos</Text>
          <Text style={s.summaryValue}>{produtos.length}</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Estoque baixo</Text>
          <Text style={[s.summaryValue, baixos.length > 0 && { color: '#991B1B' }]}>{baixos.length}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll}>
        {produtos.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📦</Text>
            <Text style={s.emptyTitle}>Sem produtos no estoque</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={openNew}>
              <Text style={s.emptyBtnText}>+ Cadastrar primeiro</Text>
            </TouchableOpacity>
          </View>
        ) : produtos.map((p) => {
          const baixo = p.qtd <= p.qtdMinima
          return (
            <View key={p.id} style={[s.card, baixo && { borderColor: '#FCA5A5' }]}>
              <TouchableOpacity style={s.cardMain} onPress={() => openEdit(p)}>
                <View style={{ flex: 1 }}>
                  <View style={s.cardTopRow}>
                    <Text style={s.cardName}>{p.nome}</Text>
                    {baixo && <Text style={s.baixoBadge}>⚠️ baixo</Text>}
                  </View>
                  <Text style={s.cardMeta}>
                    {p.categoria} · venda R$ {p.precoVenda}
                  </Text>
                </View>
                <View style={s.qtdBox}>
                  <Text style={[s.qtdValue, baixo && { color: '#991B1B' }]}>{p.qtd}</Text>
                  <Text style={s.qtdUnit}>{p.unidade}</Text>
                </View>
              </TouchableOpacity>
              <View style={s.cardActions}>
                <Text style={s.cardSub}>Mínimo {p.qtdMinima} · Custo R$ {p.precoCusto}</Text>
                <TouchableOpacity onPress={() => handleDelete(p)}>
                  <Text style={s.deleteText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        })}
        <View style={{ height: 60 }} />
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Text style={s.modalClose}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>{editing ? 'Editar produto' : 'Novo produto'}</Text>
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
                placeholder="Ex: Pomada modeladora"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={s.label}>Categoria</Text>
              <View style={s.chipRow}>
                {CATEGORIAS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[s.chip, form.categoria === c && s.chipActive]}
                    onPress={() => setForm((f) => ({ ...f, categoria: c }))}
                  >
                    <Text style={[s.chipText, form.categoria === c && s.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.row2}>
                <View style={{ flex: 2 }}>
                  <Text style={s.label}>Quantidade</Text>
                  <TextInput
                    style={s.input}
                    value={String(form.qtd)}
                    onChangeText={(v) => setForm((f) => ({ ...f, qtd: Number(v.replace(/\D/g, '')) || 0 }))}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Unidade</Text>
                  <View style={s.chipRowMini}>
                    {UNIDADES.map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[s.chipMini, form.unidade === u && s.chipActive]}
                        onPress={() => setForm((f) => ({ ...f, unidade: u }))}
                      >
                        <Text style={[s.chipText, form.unidade === u && s.chipTextActive]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={s.label}>Quantidade mínima (alerta)</Text>
              <TextInput
                style={s.input}
                value={String(form.qtdMinima)}
                onChangeText={(v) => setForm((f) => ({ ...f, qtdMinima: Number(v.replace(/\D/g, '')) || 0 }))}
                keyboardType="number-pad"
              />

              <View style={s.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Preço custo (R$)</Text>
                  <TextInput
                    style={s.input}
                    value={String(form.precoCusto)}
                    onChangeText={(v) => setForm((f) => ({ ...f, precoCusto: Number(v.replace(/\D/g, '')) || 0 }))}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Preço venda (R$)</Text>
                  <TextInput
                    style={s.input}
                    value={String(form.precoVenda)}
                    onChangeText={(v) => setForm((f) => ({ ...f, precoVenda: Number(v.replace(/\D/g, '')) || 0 }))}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {form.precoCusto > 0 && form.precoVenda > 0 && (
                <Text style={s.marginText}>
                  Margem: R$ {(form.precoVenda - form.precoCusto).toFixed(2)} ({Math.round(((form.precoVenda - form.precoCusto) / form.precoCusto) * 100)}%)
                </Text>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F6F2' },
  header: { backgroundColor: '#1A3A6B', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { color: '#F5A623', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  addBtn: { backgroundColor: '#F5A623', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  addBtnText: { color: '#1A3A6B', fontWeight: '700', fontSize: 13 },
  summary: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  summaryItem: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  summaryValue: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 4 },
  scroll: { flex: 1, paddingHorizontal: 12 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 12 },
  emptyBtn: { backgroundColor: '#1A3A6B', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  baixoBadge: { fontSize: 10, color: '#991B1B', backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontWeight: '700' },
  cardMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  qtdBox: { alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, minWidth: 56 },
  qtdValue: { fontSize: 18, fontWeight: '800', color: '#1A3A6B' },
  qtdUnit: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  cardSub: { fontSize: 11, color: '#6B7280' },
  deleteText: { fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  modalClose: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  modalSave: { color: '#1A3A6B', fontSize: 15, fontWeight: '700' },
  modalBody: { paddingHorizontal: 20, paddingVertical: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipRowMini: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  chipMini: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  chipActive: { borderColor: '#1A3A6B', backgroundColor: '#EFF6FF' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#1A3A6B', fontWeight: '700' },
  row2: { flexDirection: 'row', gap: 10 },
  marginText: { backgroundColor: '#D1FAE5', borderRadius: 10, padding: 12, marginTop: 16, fontSize: 13, fontWeight: '600', color: '#065F46', textAlign: 'center' },
})
