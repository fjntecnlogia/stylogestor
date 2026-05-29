import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useCallback, useState } from 'react'
import { useRouter, useFocusEffect } from 'expo-router'
import { format } from 'date-fns'
import { listLancamentos, deleteLancamento, type Lancamento, type MetodoPagamento } from '../../lib/lancamentos'
import { listAgendamentos, type Agendamento } from '../../lib/agendamentos'

const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
  PIX:      { bg: '#D1FAE5', color: '#065F46' },
  Dinheiro: { bg: '#FEF9C3', color: '#92400E' },
  Cartão:   { bg: '#DBEAFE', color: '#1E40AF' },
  Outro:    { bg: '#F3F4F6', color: '#374151' },
}

// Converte agendamentos CONCLUÍDOS em lançamentos "virtuais" (entradas)
// pra somar com lançamentos manuais. Os agendados ainda não geraram entrada.
function agendamentosToEntradas(ags: Agendamento[]): Lancamento[] {
  return ags
    .filter((a) => a.status === 'COMPLETED')
    .map((a) => ({
      id: `ag-${a.id}`,
      type: 'IN' as const,
      desc: `${a.servicoNomes} — ${a.clienteNome}`,
      method: 'Dinheiro' as MetodoPagamento, // default; idealmente vem do agendamento futuramente
      amount: a.price,
      date: a.date,
      time: a.time,
      agendamentoId: a.id,
      createdAt: a.createdAt,
    }))
}

export default function FinanceiroScreen() {
  const router = useRouter()
  const [tab, setTab] = useState<'all' | 'in' | 'out'>('all')
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])

  const reload = useCallback(async () => {
    const [ls, ags] = await Promise.all([listLancamentos(), listAgendamentos()])
    setLancamentos(ls)
    setAgendamentos(ags)
  }, [])

  useFocusEffect(useCallback(() => { reload() }, [reload]))

  const todayStr = format(new Date(), 'dd/MM')

  // Unifica lançamentos manuais + agendamentos COMPLETED, ordena por data desc
  const todos = [...lancamentos, ...agendamentosToEntradas(agendamentos)].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )

  // Filtros do dia
  const doDia = todos.filter((t) => t.date === todayStr)
  const income = doDia.filter((t) => t.type === 'IN').reduce((s, t) => s + t.amount, 0)
  const expense = doDia.filter((t) => t.type === 'OUT').reduce((s, t) => s + t.amount, 0)

  const filtered = todos.filter((t) =>
    tab === 'all' || (tab === 'in' ? t.type === 'IN' : t.type === 'OUT'),
  )

  const handleDelete = (l: Lancamento) => {
    if (l.agendamentoId) {
      Alert.alert('Atenção', 'Esse lançamento veio de um agendamento concluído. Cancele/reabra o agendamento na aba Agenda.')
      return
    }
    Alert.alert('Excluir lançamento?', `${l.desc}\nR$ ${l.amount.toFixed(2).replace('.', ',')}`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLancamento(l.id)
            reload()
          } catch (err) {
            Alert.alert(
              'Não foi possível excluir',
              err instanceof Error ? err.message : 'Tente novamente mais tarde.',
            )
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Financeiro</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/novo-lancamento')}>
          <Text style={s.addBtnText}>+ Lançamento</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* KPIs do dia */}
        <View style={s.kpiRow}>
          <View style={[s.kpiCard, { backgroundColor: '#F0FDF4' }]}>
            <Text style={s.kpiLabel}>Entradas hoje</Text>
            <Text style={[s.kpiValue, { color: '#1B8A5A' }]}>R$ {income}</Text>
          </View>
          <View style={[s.kpiCard, { backgroundColor: '#FEF2F2' }]}>
            <Text style={s.kpiLabel}>Saídas hoje</Text>
            <Text style={[s.kpiValue, { color: '#EF4444' }]}>R$ {expense}</Text>
          </View>
          <View style={[s.kpiCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={s.kpiLabel}>Saldo</Text>
            <Text style={[s.kpiValue, { color: '#1A3A6B' }]}>R$ {income - expense}</Text>
          </View>
        </View>

        {/* Formas de pagamento */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Formas de pagamento (hoje)</Text>
          <View style={s.methodRow}>
            {(['PIX', 'Dinheiro', 'Cartão'] as const).map((m) => {
              const total = doDia
                .filter((t) => t.method === m && t.type === 'IN')
                .reduce((s, t) => s + t.amount, 0)
              const mc = METHOD_COLORS[m]
              return (
                <View key={m} style={[s.methodCard, { backgroundColor: mc.bg }]}>
                  <Text style={[s.methodName, { color: mc.color }]}>{m}</Text>
                  <Text style={[s.methodValue, { color: mc.color }]}>R$ {total}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Filtro */}
        <View style={s.section}>
          <View style={s.tabRow}>
            {(['all', 'in', 'out'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.tabBtn, tab === t && s.tabBtnActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>
                  {t === 'all' ? 'Todos' : t === 'in' ? '↑ Entradas' : '↓ Saídas'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>💼</Text>
              <Text style={s.emptyText}>Nenhum lançamento ainda</Text>
              <Text style={s.emptySub}>Toque em "+ Lançamento" pra registrar.</Text>
            </View>
          ) : (
            filtered.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={s.txCard}
                onLongPress={() => !t.agendamentoId && handleDelete(t)}
                delayLongPress={400}
              >
                <View style={[s.txDot, { backgroundColor: t.type === 'IN' ? '#1B8A5A' : '#EF4444' }]} />
                <View style={s.txInfo}>
                  <Text style={s.txDesc}>{t.desc}</Text>
                  <Text style={s.txMeta}>
                    {t.date} {t.time} • {t.method}
                    {t.agendamentoId ? ' • via Agenda' : ''}
                  </Text>
                </View>
                <Text style={[s.txAmount, { color: t.type === 'IN' ? '#1B8A5A' : '#EF4444' }]}>
                  {t.type === 'IN' ? '+' : '-'} R$ {t.amount}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Saldo do dia */}
        {filtered.length > 0 && (
          <View style={s.closeBox}>
            <Text style={s.closeSub}>Saldo do dia</Text>
            <Text style={s.closeValue}>R$ {income - expense}</Text>
            <Text style={s.closeHint}>Pressione longo num lançamento manual pra excluir</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
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
  kpiRow: { flexDirection: 'row', gap: 8, padding: 12 },
  kpiCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  kpiLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  kpiValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  section: { paddingHorizontal: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  methodRow: { flexDirection: 'row', gap: 8 },
  methodCard: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  methodName: { fontSize: 11, fontWeight: '600' },
  methodValue: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  tabRow: {
    flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 4,
    marginBottom: 10, gap: 2,
  },
  tabBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  tabBtnTextActive: { color: '#1A3A6B' },
  txCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 6,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  txDot: { width: 8, height: 8, borderRadius: 4 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 13, fontWeight: '600', color: '#111827' },
  txMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, color: '#6B7280', fontWeight: '600', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  closeBox: { margin: 12, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center' },
  closeSub: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  closeValue: { fontSize: 24, fontWeight: '900', color: '#1A3A6B', marginTop: 4 },
  closeHint: { fontSize: 11, color: '#9CA3AF', marginTop: 8 },
})
