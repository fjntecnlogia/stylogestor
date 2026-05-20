import { ScrollView, View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native'
import { useCallback, useState } from 'react'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter, useFocusEffect } from 'expo-router'
import { listAgendamentos, updateAgendamentoStatus, type Agendamento } from '../../lib/agendamentos'

const STATUS = {
  COMPLETED:   { label: 'Concluído',   color: '#065F46', bg: '#D1FAE5' },
  IN_PROGRESS: { label: 'Em atend.',   color: '#991B1B', bg: '#FEE2E2' },
  SCHEDULED:   { label: 'Agendado',    color: '#92400E', bg: '#FEF9C3' },
  CONFIRMED:   { label: 'Confirmado',  color: '#1E40AF', bg: '#DBEAFE' },
  CANCELED:    { label: 'Cancelado',   color: '#6B7280', bg: '#F3F4F6' },
}

export default function AgendaScreen() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedApt, setSelectedApt] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Agendamento[]>([])

  // Recarrega da storage toda vez que a tab ganha foco (apos novo agendamento, etc.)
  const reload = useCallback(() => {
    listAgendamentos().then(setAppointments)
  }, [])
  useFocusEffect(useCallback(() => { reload() }, [reload]))

  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))
  const selectedDateStr = format(selectedDate, 'dd/MM')
  const dayAppointments = appointments.filter(a => a.date === selectedDateStr)

  const updateStatus = async (id: string, status: Agendamento['status']) => {
    await updateAgendamentoStatus(id, status)
    reload()
  }
  const confirmCancel = (id: string, client: string) => {
    Alert.alert(`Cancelar agendamento de ${client}?`, 'Esta ação não pode ser desfeita.', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar', style: 'destructive', onPress: () => updateStatus(id, 'CANCELED') },
    ])
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Agenda</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/novo-agendamento')}>
          <Text style={s.addBtnText}>+ Agendar</Text>
        </TouchableOpacity>
      </View>

      {/* Dias */}
      <View style={s.daysBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.daysScroll}>
          {days.map((day) => {
            const isSelected = format(day, 'dd/MM') === format(selectedDate, 'dd/MM')
            const isToday = format(day, 'dd/MM') === format(new Date(), 'dd/MM')
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[s.dayBtn, isSelected && s.dayBtnActive]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[s.dayName, isSelected && s.dayNameActive]}>
                  {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                </Text>
                <Text style={[s.dayNum, isSelected && s.dayNumActive]}>
                  {format(day, 'd')}
                </Text>
                {isToday && <View style={[s.todayDot, isSelected && s.todayDotActive]} />}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Stats do dia */}
      <View style={s.dayStats}>
        <Text style={s.dayStatsText}>
          {dayAppointments.filter(a => a.status === 'COMPLETED').length} concluídos •{' '}
          {dayAppointments.filter(a => a.status === 'SCHEDULED').length} agendados •{' '}
          R$ {dayAppointments.filter(a => a.status === 'COMPLETED').reduce((s, a) => s + a.price, 0)}
        </Text>
      </View>

      {/* Lista */}
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {dayAppointments.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyText}>Sem agendamentos neste dia</Text>
          </View>
        ) : dayAppointments.map((apt) => {
          const st = STATUS[apt.status as keyof typeof STATUS]
          const isSelected = selectedApt === apt.id
          return (
            <TouchableOpacity
              key={apt.id}
              style={[s.card, isSelected && s.cardSelected]}
              onPress={() => setSelectedApt(isSelected ? null : apt.id)}
            >
              <View style={[s.timeCol, apt.status === 'IN_PROGRESS' && { backgroundColor: '#1A3A6B' }]}>
                <Text style={[s.timeText, apt.status === 'IN_PROGRESS' && { color: '#fff' }]}>{apt.time}</Text>
              </View>

              <View style={s.infoCol}>
                <Text style={s.clientName}>{apt.clienteNome}</Text>
                <Text style={s.serviceText}>{apt.servicoNomes} • {apt.profissionalNome}</Text>
                {isSelected && (
                  <View style={s.actions}>
                    <TouchableOpacity
                      style={[s.actionBtn, { backgroundColor: '#1B8A5A' }]}
                      onPress={() => updateStatus(apt.id, 'COMPLETED')}
                    >
                      <Text style={s.actionBtnText}>✓ Concluir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.actionBtn, { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#1A3A6B' }]}
                      onPress={() => Alert.alert('Editar agendamento', 'Edição completa em desenvolvimento. Cancele e crie um novo se precisar.')}
                    >
                      <Text style={[s.actionBtnText, { color: '#1A3A6B' }]}>✏️ Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.actionBtn, { backgroundColor: '#FEE2E2' }]}
                      onPress={() => confirmCancel(apt.id, apt.clienteNome)}
                    >
                      <Text style={[s.actionBtnText, { color: '#991B1B' }]}>✕ Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={s.rightCol}>
                <View style={[s.badge, { backgroundColor: st.bg }]}>
                  <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                </View>
                <Text style={s.price}>R$ {apt.price}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
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
  daysBar: { backgroundColor: '#1A3A6B', paddingBottom: 16 },
  daysScroll: { paddingHorizontal: 16, gap: 8 },
  dayBtn: {
    width: 52, paddingVertical: 8, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dayBtnActive: { backgroundColor: '#F5A623' },
  dayName: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  dayNameActive: { color: '#1A3A6B' },
  dayNum: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },
  dayNumActive: { color: '#1A3A6B' },
  todayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F5A623', marginTop: 3 },
  todayDotActive: { backgroundColor: '#1A3A6B' },
  dayStats: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  dayStatsText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  scroll: { flex: 1, padding: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardSelected: { borderWidth: 1.5, borderColor: '#1A3A6B' },
  timeCol: {
    width: 56, height: 56, borderRadius: 12, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  timeText: { fontWeight: '700', fontSize: 13, color: '#374151' },
  infoCol: { flex: 1 },
  clientName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  serviceText: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  price: { fontSize: 13, fontWeight: '700', color: '#1B8A5A' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#6B7280', fontWeight: '600', marginTop: 12 },
})
