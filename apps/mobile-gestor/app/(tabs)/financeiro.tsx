import { ScrollView, View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native'
import { useState } from 'react'

const TRANSACTIONS = [
  { id: '1', type: 'IN',  desc: 'Corte — Carlos Oliveira', method: 'PIX',      amount: 40,  time: '09:30' },
  { id: '2', type: 'IN',  desc: 'Barba — Rafael Santos',   method: 'Dinheiro', amount: 30,  time: '10:00' },
  { id: '3', type: 'IN',  desc: 'Combo — Pedro Alves',     method: 'Cartão',   amount: 60,  time: '10:45' },
  { id: '4', type: 'OUT', desc: 'Shampoo profissional',     method: 'Dinheiro', amount: 85,  time: '11:00' },
  { id: '5', type: 'IN',  desc: 'Corte — Lucas Ferreira',  method: 'PIX',      amount: 40,  time: '14:00' },
  { id: '6', type: 'IN',  desc: 'Produto — Pomada Wax',    method: 'Dinheiro', amount: 35,  time: '14:30' },
]

const income  = TRANSACTIONS.filter(t => t.type === 'IN').reduce((s, t) => s + t.amount, 0)
const expense = TRANSACTIONS.filter(t => t.type === 'OUT').reduce((s, t) => s + t.amount, 0)

const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
  PIX:      { bg: '#D1FAE5', color: '#065F46' },
  Dinheiro: { bg: '#FEF9C3', color: '#92400E' },
  Cartão:   { bg: '#DBEAFE', color: '#1E40AF' },
}

export default function FinanceiroScreen() {
  const [tab, setTab] = useState<'all' | 'in' | 'out'>('all')

  const filtered = TRANSACTIONS.filter(t =>
    tab === 'all' || (tab === 'in' ? t.type === 'IN' : t.type === 'OUT')
  )

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Financeiro</Text>
        <TouchableOpacity style={s.addBtn}>
          <Text style={s.addBtnText}>+ Lançamento</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* KPIs */}
        <View style={s.kpiRow}>
          <View style={[s.kpiCard, { backgroundColor: '#F0FDF4' }]}>
            <Text style={s.kpiLabel}>Entradas</Text>
            <Text style={[s.kpiValue, { color: '#1B8A5A' }]}>R$ {income}</Text>
          </View>
          <View style={[s.kpiCard, { backgroundColor: '#FEF2F2' }]}>
            <Text style={s.kpiLabel}>Saídas</Text>
            <Text style={[s.kpiValue, { color: '#EF4444' }]}>R$ {expense}</Text>
          </View>
          <View style={[s.kpiCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={s.kpiLabel}>Saldo</Text>
            <Text style={[s.kpiValue, { color: '#1A3A6B' }]}>R$ {income - expense}</Text>
          </View>
        </View>

        {/* Formas de pagamento */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Formas de pagamento</Text>
          <View style={s.methodRow}>
            {['PIX', 'Dinheiro', 'Cartão'].map((m) => {
              const total = TRANSACTIONS.filter(t => t.method === m && t.type === 'IN').reduce((s, t) => s + t.amount, 0)
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

        {/* Transações */}
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

          {filtered.map(t => (
            <View key={t.id} style={s.txCard}>
              <View style={[s.txDot, { backgroundColor: t.type === 'IN' ? '#1B8A5A' : '#EF4444' }]} />
              <View style={s.txInfo}>
                <Text style={s.txDesc}>{t.desc}</Text>
                <Text style={s.txMeta}>{t.time} • {t.method}</Text>
              </View>
              <Text style={[s.txAmount, { color: t.type === 'IN' ? '#1B8A5A' : '#EF4444' }]}>
                {t.type === 'IN' ? '+' : '-'} R$ {t.amount}
              </Text>
            </View>
          ))}
        </View>

        {/* Fechar caixa */}
        <View style={s.closeBox}>
          <TouchableOpacity style={s.closeBtn}>
            <Text style={s.closeBtnText}>🔒 Fechar caixa do dia</Text>
          </TouchableOpacity>
          <Text style={s.closeSub}>Saldo final: R$ {income - expense}</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
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
  closeBox: { margin: 12, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center' },
  closeBtn: {
    backgroundColor: '#1A3A6B', paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, width: '100%', alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  closeSub: { fontSize: 12, color: '#6B7280', marginTop: 8 },
})
