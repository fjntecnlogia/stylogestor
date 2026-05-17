import { ScrollView, View, Text, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { dashboardApi } from '../../lib/api'

const STATS = [
  { label: 'Caixa hoje',        value: 'R$ 1.240', sub: '▲ 18% vs ontem',  color: '#1B8A5A', bg: '#F0FDF4' },
  { label: 'Agendamentos',      value: '12',        sub: '3 pendentes',      color: '#1A3A6B', bg: '#EFF6FF' },
  { label: 'Ticket médio',      value: 'R$ 85',     sub: '▲ 5% este mês',   color: '#F5A623', bg: '#FFFBEB' },
  { label: 'Clientes hoje',     value: '9',         sub: '2 novos clientes', color: '#7C3AED', bg: '#F5F3FF' },
]

const APPOINTMENTS = [
  { id: '1', client: 'Carlos Oliveira',  service: 'Corte + Barba', time: '09:00', prof: 'João', status: 'done' },
  { id: '2', client: 'Rafael Santos',    service: 'Corte',         time: '10:00', prof: 'João', status: 'done' },
  { id: '3', client: 'Pedro Alves',      service: 'Barba',         time: '14:00', prof: 'Pedro', status: 'next' },
  { id: '4', client: 'Lucas Ferreira',   service: 'Corte',         time: '15:00', prof: 'João', status: 'pending' },
]

const STATUS_CONFIG = {
  done:    { label: 'Concluído',  color: '#1B8A5A', bg: '#D1FAE5' },
  next:    { label: 'Próximo',    color: '#1A3A6B', bg: '#DBEAFE' },
  pending: { label: 'Agendado',   color: '#92400E', bg: '#FEF9C3' },
}

export default function DashboardScreen() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [kpis, setKpis] = useState<{
    agendamentosHoje: number; receitaMes: number; totalClientes: number; lucroMes: number
  } | null>(null)
  const [appointments, setAppointments] = useState(APPOINTMENTS)

  const fetchData = useCallback(async () => {
    try {
      const data = await dashboardApi.get()
      if (data.kpis) {
        setKpis(data.kpis)
      }
      if (data.agendamentosHoje?.length > 0) {
        setAppointments(data.agendamentosHoje.map(a => ({
          id: a.id,
          client: a.clientName,
          service: a.services,
          time: a.time,
          prof: a.professionalName,
          status: a.status === 'COMPLETED' ? 'done' : a.status === 'IN_PROGRESS' ? 'next' : 'pending',
        })))
      }
    } catch {
      // Fallback para mock
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const onRefresh = () => {
    setRefreshing(true)
    fetchData().finally(() => setRefreshing(false))
  }

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite'
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting}, João! 👋</Text>
          <Text style={s.date} numberOfLines={1}>{dateStr}</Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarText}>J</Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A3A6B" />}
      >
        {/* KPI Cards */}
        <View style={s.kpiGrid}>
          {(kpis ? [
            { label: 'Caixa do mês',    value: `R$ ${kpis.receitaMes.toLocaleString('pt-BR')}`, sub: `Lucro: R$ ${kpis.lucroMes.toLocaleString('pt-BR')}`, color: '#1B8A5A', bg: '#F0FDF4' },
            { label: 'Agendamentos',    value: String(kpis.agendamentosHoje), sub: 'hoje',         color: '#1A3A6B', bg: '#EFF6FF' },
            { label: 'Total clientes',  value: String(kpis.totalClientes),    sub: `+${kpis.novosClientesMes} este mês`, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Novos clientes',  value: String(kpis.novosClientesMes), sub: 'este mês',     color: '#F5A623', bg: '#FFFBEB' },
          ] : STATS).map((stat) => (
            <View key={stat.label} style={[s.kpiCard, { backgroundColor: stat.bg }]}>
              <Text style={s.kpiLabel}>{stat.label}</Text>
              <Text style={[s.kpiValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[s.kpiSub, { color: stat.color }]}>{stat.sub}</Text>
            </View>
          ))}
        </View>

        {/* Ação rápida */}
        <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/(tabs)/agenda')}>
          <Text style={s.ctaText}>+ Novo agendamento</Text>
        </TouchableOpacity>

        {/* Agendamentos de hoje */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Agendamentos de hoje</Text>
          {appointments.map((apt) => {
            const st = STATUS_CONFIG[apt.status as keyof typeof STATUS_CONFIG]
            return (
              <TouchableOpacity key={apt.id} style={s.aptCard}>
                <View style={[s.aptTime, { backgroundColor: apt.status === 'next' ? '#1A3A6B' : '#F3F4F6' }]}>
                  <Text style={[s.aptTimeText, { color: apt.status === 'next' ? '#fff' : '#374151' }]}>{apt.time}</Text>
                </View>
                <View style={s.aptInfo}>
                  <Text style={s.aptClient}>{apt.client}</Text>
                  <Text style={s.aptService}>{apt.service} • {apt.prof}</Text>
                </View>
                <View style={[s.aptBadge, { backgroundColor: st.bg }]}>
                  <Text style={[s.aptBadgeText, { color: st.color }]}>{st.label}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Fluxo de caixa mini */}
        <View style={s.cashCard}>
          <Text style={s.sectionTitle}>Caixa do dia</Text>
          <View style={s.cashRow}>
            <View style={s.cashItem}>
              <Text style={s.cashLabel}>Entradas</Text>
              <Text style={[s.cashValue, { color: '#1B8A5A' }]}>R$ 1.325</Text>
            </View>
            <View style={s.cashDivider} />
            <View style={s.cashItem}>
              <Text style={s.cashLabel}>Saídas</Text>
              <Text style={[s.cashValue, { color: '#EF4444' }]}>R$ 85</Text>
            </View>
            <View style={s.cashDivider} />
            <View style={s.cashItem}>
              <Text style={s.cashLabel}>Saldo</Text>
              <Text style={[s.cashValue, { color: '#1A3A6B' }]}>R$ 1.240</Text>
            </View>
          </View>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  greeting: { color: '#fff', fontSize: 18, fontWeight: '700' },
  date: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5A623',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#1A3A6B', fontWeight: '900', fontSize: 18 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  kpiCard: {
    width: '47%', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  kpiLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  kpiValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  kpiSub: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  ctaBtn: {
    backgroundColor: '#1A3A6B', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 14,
    shadowColor: '#1A3A6B', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  aptCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  aptTime: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  aptTimeText: { fontWeight: '700', fontSize: 13 },
  aptInfo: { flex: 1 },
  aptClient: { fontSize: 14, fontWeight: '600', color: '#111827' },
  aptService: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  aptBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  aptBadgeText: { fontSize: 10, fontWeight: '700' },
  cashCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cashRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  cashItem: { flex: 1, alignItems: 'center' },
  cashLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  cashValue: { fontSize: 17, fontWeight: '800', marginTop: 4 },
  cashDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
})
