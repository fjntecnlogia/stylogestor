import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState, useCallback } from 'react'
import { useRouter, useFocusEffect } from 'expo-router'
import { useUser } from '../../lib/auth'
import { format } from 'date-fns'
import { listAgendamentos, type Agendamento } from '../../lib/agendamentos'
import { listLancamentos, type Lancamento } from '../../lib/lancamentos'

const STATUS_CONFIG = {
  COMPLETED:   { label: 'Concluído',  color: '#1B8A5A', bg: '#D1FAE5' },
  IN_PROGRESS: { label: 'Em atend.',  color: '#991B1B', bg: '#FEE2E2' },
  SCHEDULED:   { label: 'Agendado',   color: '#92400E', bg: '#FEF9C3' },
  CONFIRMED:   { label: 'Confirmado', color: '#1E40AF', bg: '#DBEAFE' },
  CANCELED:    { label: 'Cancelado',  color: '#6B7280', bg: '#F3F4F6' },
}

export default function DashboardScreen() {
  const router = useRouter()
  const { user } = useUser()
  const [refreshing, setRefreshing] = useState(false)
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])

  const reload = useCallback(async () => {
    const [ags, lcs] = await Promise.all([listAgendamentos(), listLancamentos()])
    setAgendamentos(ags)
    setLancamentos(lcs)
  }, [])

  useFocusEffect(useCallback(() => { reload() }, [reload]))

  const onRefresh = () => {
    setRefreshing(true)
    reload().finally(() => setRefreshing(false))
  }

  const now = new Date()
  const todayStr = format(now, 'dd/MM')
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite'
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const userName =
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'gestor'
  const avatarLetter = userName.charAt(0).toUpperCase()

  // ── Cálculos do dia (dados reais) ───────────────────────────
  const agsHoje = agendamentos.filter((a) => a.date === todayStr)
  const concluidos = agsHoje.filter((a) => a.status === 'COMPLETED')
  const pendentes = agsHoje.filter((a) => ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status))
  const entradasAgendamentos = concluidos.reduce((s, a) => s + a.price, 0)

  const lcsHoje = lancamentos.filter((l) => l.date === todayStr)
  const entradasManuais = lcsHoje.filter((l) => l.type === 'IN').reduce((s, l) => s + l.amount, 0)
  const saidasManuais = lcsHoje.filter((l) => l.type === 'OUT').reduce((s, l) => s + l.amount, 0)

  const totalEntradas = entradasAgendamentos + entradasManuais
  const totalSaidas = saidasManuais
  const saldo = totalEntradas - totalSaidas

  const ticketMedio = concluidos.length > 0 ? Math.round(entradasAgendamentos / concluidos.length) : 0
  const clientesHoje = new Set(agsHoje.map((a) => a.clienteId)).size

  const STATS = [
    { label: 'Caixa hoje',     value: `R$ ${saldo}`,      sub: `Entradas R$ ${totalEntradas}`,             color: '#1B8A5A', bg: '#F0FDF4' },
    { label: 'Agendamentos',   value: String(agsHoje.length), sub: `${pendentes.length} pendentes`,        color: '#1A3A6B', bg: '#EFF6FF' },
    { label: 'Ticket médio',   value: `R$ ${ticketMedio}`, sub: `${concluidos.length} concluídos`,         color: '#F5A623', bg: '#FFFBEB' },
    { label: 'Clientes hoje',  value: String(clientesHoje), sub: agsHoje.length === 0 ? 'sem agenda hoje' : 'distintos', color: '#7C3AED', bg: '#F5F3FF' },
  ]

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.greeting}>{greeting}, {userName}! 👋</Text>
          <Text style={s.date} numberOfLines={1}>{dateStr}</Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{avatarLetter}</Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A3A6B" />}
      >
        {/* KPI Cards */}
        <View style={s.kpiGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={[s.kpiCard, { backgroundColor: stat.bg }]}>
              <Text style={s.kpiLabel}>{stat.label}</Text>
              <Text style={[s.kpiValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[s.kpiSub, { color: stat.color }]}>{stat.sub}</Text>
            </View>
          ))}
        </View>

        {/* Ação rápida */}
        <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/novo-agendamento')}>
          <Text style={s.ctaText}>+ Novo agendamento</Text>
        </TouchableOpacity>

        {/* Agendamentos de hoje */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Agendamentos de hoje</Text>
          {agsHoje.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>📭</Text>
              <Text style={s.emptyText}>Nenhum agendamento hoje</Text>
              <Text style={s.emptySub}>Toque em "+ Novo agendamento" pra criar.</Text>
            </View>
          ) : (
            agsHoje.map((apt) => {
              const st = STATUS_CONFIG[apt.status as keyof typeof STATUS_CONFIG]
              return (
                <TouchableOpacity
                  key={apt.id}
                  style={s.aptCard}
                  onPress={() => router.push('/(tabs)/agenda')}
                >
                  <View style={[s.aptTime, { backgroundColor: apt.status === 'IN_PROGRESS' ? '#1A3A6B' : '#F3F4F6' }]}>
                    <Text style={[s.aptTimeText, { color: apt.status === 'IN_PROGRESS' ? '#fff' : '#374151' }]}>{apt.time}</Text>
                  </View>
                  <View style={s.aptInfo}>
                    <Text style={s.aptClient}>{apt.clienteNome}</Text>
                    <Text style={s.aptService}>{apt.servicoNomes} • {apt.profissionalNome}</Text>
                  </View>
                  <View style={[s.aptBadge, { backgroundColor: st.bg }]}>
                    <Text style={[s.aptBadgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </TouchableOpacity>
              )
            })
          )}
        </View>

        {/* Fluxo de caixa mini */}
        <View style={s.cashCard}>
          <Text style={s.sectionTitle}>Caixa do dia</Text>
          <View style={s.cashRow}>
            <View style={s.cashItem}>
              <Text style={s.cashLabel}>Entradas</Text>
              <Text style={[s.cashValue, { color: '#1B8A5A' }]}>R$ {totalEntradas}</Text>
            </View>
            <View style={s.cashDivider} />
            <View style={s.cashItem}>
              <Text style={s.cashLabel}>Saídas</Text>
              <Text style={[s.cashValue, { color: '#EF4444' }]}>R$ {totalSaidas}</Text>
            </View>
            <View style={s.cashDivider} />
            <View style={s.cashItem}>
              <Text style={s.cashLabel}>Saldo</Text>
              <Text style={[s.cashValue, { color: '#1A3A6B' }]}>R$ {saldo}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.cashCta} onPress={() => router.push('/(tabs)/financeiro')}>
            <Text style={s.cashCtaText}>Ver financeiro completo →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
  header: {
    backgroundColor: '#1A3A6B', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  greeting: { color: '#fff', fontSize: 18, fontWeight: '700' },
  date: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5A623',
    alignItems: 'center', justifyContent: 'center', marginLeft: 12,
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
  empty: {
    backgroundColor: '#fff', borderRadius: 14, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  cashCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cashRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  cashItem: { flex: 1, alignItems: 'center' },
  cashLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  cashValue: { fontSize: 17, fontWeight: '800', marginTop: 4 },
  cashDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  cashCta: { marginTop: 14, alignSelf: 'center' },
  cashCtaText: { color: '#1A3A6B', fontWeight: '600', fontSize: 13 },
})
