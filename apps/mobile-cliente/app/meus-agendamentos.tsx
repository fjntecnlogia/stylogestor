import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useCallback, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  listAgendamentos,
  updateStatusAgendamento,
  deleteAgendamento,
  type Agendamento,
  type StatusAgendamento,
} from '../lib/agendamentos'

const STATUS_CONFIG: Record<StatusAgendamento, { label: string; color: string; bg: string }> = {
  AGENDADO:   { label: 'Agendado',   color: '#92400E', bg: '#FEF9C3' },
  CONFIRMADO: { label: 'Confirmado', color: '#1E40AF', bg: '#DBEAFE' },
  CONCLUIDO:  { label: 'Concluído',  color: '#065F46', bg: '#D1FAE5' },
  CANCELADO:  { label: 'Cancelado',  color: '#6B7280', bg: '#F3F4F6' },
}

export default function MeusAgendamentosScreen() {
  const [filter, setFilter] = useState<'todos' | 'futuros' | 'passados'>('todos')
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])

  const reload = useCallback(async () => {
    const list = await listAgendamentos()
    setAgendamentos(list)
  }, [])

  useFocusEffect(useCallback(() => { reload() }, [reload]))

  const agora = new Date().toISOString()
  const filtered = agendamentos.filter((a) => {
    if (filter === 'futuros') return a.dataISO >= agora && a.status !== 'CANCELADO'
    if (filter === 'passados') return a.dataISO < agora || a.status === 'CANCELADO' || a.status === 'CONCLUIDO'
    return true
  })

  const handleCancel = (a: Agendamento) => {
    Alert.alert(
      'Cancelar agendamento?',
      `${a.barbeariaNome}\n${a.dataFmt} às ${a.hora}\n\nVocê pode reagendar depois.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar agendamento',
          style: 'destructive',
          onPress: async () => {
            await updateStatusAgendamento(a.id, 'CANCELADO')
            reload()
          },
        },
      ],
    )
  }

  const handleDelete = (a: Agendamento) => {
    Alert.alert(
      'Apagar do histórico?',
      `Remover ${a.barbeariaNome} (${a.dataFmt}) da sua lista. Esta ação não pode ser desfeita.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            await deleteAgendamento(a.id)
            reload()
          },
        },
      ],
    )
  }

  const handleWhatsApp = (a: Agendamento) => {
    const msg = encodeURIComponent(
      `Olá! Sobre meu agendamento em ${a.barbeariaNome} no dia ${a.dataFmt} às ${a.hora}...`,
    )
    const url = `https://wa.me/?text=${msg}`
    Linking.openURL(url).catch(() => Alert.alert('WhatsApp', 'Não foi possível abrir.'))
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={s.title}>Meus agendamentos</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Filtros */}
      <View style={s.filterRow}>
        {(['todos', 'futuros', 'passados'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, filter === f && s.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {f === 'todos' ? 'Todos' : f === 'futuros' ? 'Próximos' : 'Histórico'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyText}>
              {filter === 'futuros'
                ? 'Nenhum agendamento próximo'
                : filter === 'passados'
                ? 'Nenhum agendamento no histórico'
                : 'Você ainda não fez nenhum agendamento'}
            </Text>
            <Text style={s.emptySub}>Toque em uma barbearia na tela inicial pra agendar.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.replace('/')}>
              <Text style={s.emptyBtnText}>Ver barbearias</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: a }) => {
          const st = STATUS_CONFIG[a.status]
          const isFuturo = a.dataISO >= agora && a.status !== 'CANCELADO'
          return (
            <View style={s.card}>
              <View style={s.cardTop}>
                <View style={s.cardBarbearia}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{a.barbeariaNome.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.barbeariaNome}>{a.barbeariaNome}</Text>
                    <Text style={s.servicoText}>{a.servicosNomes}</Text>
                  </View>
                </View>
                <View style={[s.badge, { backgroundColor: st.bg }]}>
                  <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>

              <View style={s.divider} />

              <View style={s.cardInfo}>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>📅 Data</Text>
                  <Text style={s.infoValue}>{a.dataFmt}</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>⏰ Horário</Text>
                  <Text style={s.infoValue}>{a.hora} ({a.duracao} min)</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>✂️ Profissional</Text>
                  <Text style={s.infoValue}>{a.profissionalNome}</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>💰 Total</Text>
                  <Text style={[s.infoValue, { fontWeight: '800', color: '#1B8A5A' }]}>R$ {a.preco}</Text>
                </View>
              </View>

              {/* Ações */}
              <View style={s.actions}>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: '#25D366' }]}
                  onPress={() => handleWhatsApp(a)}
                >
                  <Text style={s.actionBtnText}>💬 WhatsApp</Text>
                </TouchableOpacity>

                {isFuturo && (
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => handleCancel(a)}
                  >
                    <Text style={[s.actionBtnText, { color: '#991B1B' }]}>✕ Cancelar</Text>
                  </TouchableOpacity>
                )}

                {!isFuturo && (
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: '#F3F4F6' }]}
                    onPress={() => handleDelete(a)}
                  >
                    <Text style={[s.actionBtnText, { color: '#6B7280' }]}>🗑 Apagar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
  header: {
    backgroundColor: '#1A3A6B', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { color: '#F5A623', fontSize: 16, fontWeight: '700' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row', gap: 4, padding: 12, backgroundColor: '#F8F6F2',
  },
  filterBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterBtnActive: { backgroundColor: '#1A3A6B', borderColor: '#1A3A6B' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#fff' },
  list: { padding: 12, paddingTop: 0, backgroundColor: '#F8F6F2', flexGrow: 1 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardBarbearia: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A3A6B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  barbeariaNome: { fontSize: 14, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
  servicoText: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  cardInfo: { gap: 6 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#111827', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#6B7280', fontWeight: '600', marginTop: 12, textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
  emptyBtn: { backgroundColor: '#F5A623', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  emptyBtnText: { color: '#1A3A6B', fontWeight: '700', fontSize: 14 },
})
