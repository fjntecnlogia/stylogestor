import { ScrollView, View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { useState, useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { addDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useUser } from '@clerk/clerk-expo'

const SERVICES = [
  { id: '1', name: 'Corte masculino', duration: 30, price: 40 },
  { id: '2', name: 'Barba',           duration: 30, price: 30 },
  { id: '3', name: 'Corte + Barba',   duration: 45, price: 60 },
  { id: '4', name: 'Pigmentação',     duration: 60, price: 80 },
]

const PROFESSIONALS = [
  { id: '1', name: 'João Silva',      role: 'Barbeiro' },
  { id: '2', name: 'Pedro Costa',     role: 'Cabeleireiro' },
  { id: '0', name: 'Sem preferência', role: 'Qualquer profissional' },
]

const SLOTS = ['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30','16:00']
const DAYS  = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i + 1))

type Step = 'services' | 'professional' | 'datetime' | 'info' | 'confirm' | 'success'

export default function AgendarScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { user, isLoaded } = useUser()
  const [step, setStep] = useState<Step>('services')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [professional, setProfessional] = useState('')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Pre-fill nome e telefone do perfil Clerk quando o usuario esta logado.
  // Clerk nao captura telefone por padrao - vai ficar vazio se nao foi cadastrado.
  // Apenas seta uma vez quando isLoaded passa a true e os campos ainda estao vazios.
  useEffect(() => {
    if (!isLoaded || !user) return
    if (!name) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
      if (fullName) setName(fullName)
    }
    if (!phone) {
      const phoneFromClerk = user.primaryPhoneNumber?.phoneNumber
      if (phoneFromClerk) setPhone(phoneFromClerk)
    }
  }, [isLoaded, user])

  const total    = SERVICES.filter(s => selectedServices.includes(s.id)).reduce((a, s) => a + s.price, 0)
  const duration = SERVICES.filter(s => selectedServices.includes(s.id)).reduce((a, s) => a + s.duration, 0)
  const stepNum  = { services: 1, professional: 2, datetime: 3, info: 4, confirm: 5, success: 5 }[step]

  const toggleService = (id: string) => {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  if (step === 'success') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.successContainer}>
          <Text style={s.successEmoji}>🎉</Text>
          <Text style={s.successTitle}>Agendado com sucesso!</Text>
          <Text style={s.successSub}>Você receberá uma confirmação pelo WhatsApp.</Text>
          <View style={s.successCard}>
            <Text style={s.successInfo}>📅 {selectedDay && format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}</Text>
            <Text style={s.successInfo}>⏰ {selectedSlot}</Text>
            <Text style={s.successInfo}>💰 R$ {total}</Text>
          </View>
          <TouchableOpacity style={s.successBtn} onPress={() => router.replace('/')}>
            <Text style={s.successBtnText}>Voltar ao início</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => step === 'services' ? router.back() : setStep(
          step === 'professional' ? 'services' :
          step === 'datetime' ? 'professional' :
          step === 'info' ? 'datetime' : 'info'
        )}>
          <Text style={s.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{slug?.replace(/-/g, ' ')}</Text>
      </View>

      {/* Progress */}
      <View style={s.progress}>
        {[1,2,3,4,5].map(n => (
          <View key={n} style={[s.progressDot, n <= stepNum && s.progressDotActive]} />
        ))}
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* STEP 1 — Serviços */}
        {step === 'services' && (
          <View>
            <Text style={s.stepTitle}>Escolha os serviços</Text>
            {SERVICES.map(sv => {
              const sel = selectedServices.includes(sv.id)
              return (
                <TouchableOpacity key={sv.id} style={[s.serviceCard, sel && s.serviceCardActive]} onPress={() => toggleService(sv.id)}>
                  <View style={s.serviceInfo}>
                    <Text style={s.serviceName}>{sv.name}</Text>
                    <Text style={s.serviceDur}>⏱ {sv.duration} minutos</Text>
                  </View>
                  <View style={s.serviceRight}>
                    <Text style={[s.servicePrice, sel && { color: '#1A3A6B' }]}>R$ {sv.price}</Text>
                    {sel && <Text style={s.serviceCheck}>✓</Text>}
                  </View>
                </TouchableOpacity>
              )
            })}
            {selectedServices.length > 0 && (
              <View style={s.bottomBar}>
                <View>
                  <Text style={s.bottomTotal}>R$ {total}</Text>
                  <Text style={s.bottomDur}>{selectedServices.length} serviço(s) · {duration} min</Text>
                </View>
                <TouchableOpacity style={s.nextBtn} onPress={() => setStep('professional')}>
                  <Text style={s.nextBtnText}>Próximo →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* STEP 2 — Profissional */}
        {step === 'professional' && (
          <View>
            <Text style={s.stepTitle}>Escolha o profissional</Text>
            {PROFESSIONALS.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[s.profCard, professional === p.id && s.profCardActive]}
                onPress={() => { setProfessional(p.id); setTimeout(() => setStep('datetime'), 300) }}
              >
                <View style={s.profAvatar}><Text style={s.profAvatarText}>{p.name.charAt(0)}</Text></View>
                <View style={s.profInfo}>
                  <Text style={s.profName}>{p.name}</Text>
                  <Text style={s.profRole}>{p.role}</Text>
                </View>
                {professional === p.id && <Text style={{ color: '#1B8A5A', fontSize: 20 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* STEP 3 — Data e Hora */}
        {step === 'datetime' && (
          <View>
            <Text style={s.stepTitle}>Data e horário</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.daysRow}>
              {DAYS.map(d => {
                const sel = selectedDay?.toDateString() === d.toDateString()
                return (
                  <TouchableOpacity key={d.toISOString()} style={[s.dayBtn, sel && s.dayBtnActive]} onPress={() => setSelectedDay(d)}>
                    <Text style={[s.dayName, sel && { color: '#fff' }]}>{format(d, 'EEE', { locale: ptBR }).slice(0,3)}</Text>
                    <Text style={[s.dayNum, sel && { color: '#fff' }]}>{format(d, 'd')}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            {selectedDay && (
              <>
                <Text style={s.slotsLabel}>Horários disponíveis</Text>
                <View style={s.slotsGrid}>
                  {SLOTS.map(slot => (
                    <TouchableOpacity
                      key={slot}
                      style={[s.slotBtn, selectedSlot === slot && s.slotBtnActive]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text style={[s.slotText, selectedSlot === slot && s.slotTextActive]}>{slot}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {selectedDay && selectedSlot && (
              <TouchableOpacity style={s.nextBtnFull} onPress={() => setStep('info')}>
                <Text style={s.nextBtnText}>Próximo →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* STEP 4 — Dados */}
        {step === 'info' && (
          <View>
            <Text style={s.stepTitle}>Seus dados</Text>
            <Text style={s.inputLabel}>Nome completo *</Text>
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor="#9CA3AF" />
            <Text style={s.inputLabel}>WhatsApp *</Text>
            <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="(11) 99999-9999" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
            {name && phone && (
              <TouchableOpacity style={s.nextBtnFull} onPress={() => setStep('confirm')}>
                <Text style={s.nextBtnText}>Revisar →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* STEP 5 — Confirmação */}
        {step === 'confirm' && (
          <View>
            <Text style={s.stepTitle}>Confirme seu agendamento</Text>
            <View style={s.confirmCard}>
              {[
                { label: 'Cliente',      value: name },
                { label: 'WhatsApp',     value: phone },
                { label: 'Serviços',     value: SERVICES.filter(s => selectedServices.includes(s.id)).map(s => s.name).join(', ') },
                { label: 'Profissional', value: PROFESSIONALS.find(p => p.id === professional)?.name || '' },
                { label: 'Data',         value: selectedDay ? format(selectedDay, "d 'de' MMMM", { locale: ptBR }) : '' },
                { label: 'Horário',      value: selectedSlot },
                { label: 'Duração',      value: `${duration} minutos` },
                { label: 'Total',        value: `R$ ${total}`, bold: true },
              ].map(row => (
                <View key={row.label} style={s.confirmRow}>
                  <Text style={s.confirmLabel}>{row.label}</Text>
                  <Text style={[s.confirmValue, row.bold && s.confirmValueBold]}>{row.value}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[s.nextBtnFull, { backgroundColor: '#1B8A5A' }]} onPress={() => setStep('success')}>
              <Text style={s.nextBtnText}>✓ Confirmar agendamento</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F6F2' },
  header: { backgroundColor: '#1A3A6B', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  back: { color: '#F5A623', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, textTransform: 'capitalize' },
  progress: { backgroundColor: '#1A3A6B', flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 14 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressDotActive: { backgroundColor: '#F5A623', width: 20 },
  scroll: { flex: 1, padding: 16 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 16 },
  serviceCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  serviceCardActive: { borderColor: '#1A3A6B', backgroundColor: '#EFF6FF' },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  serviceDur: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  serviceRight: { alignItems: 'flex-end' },
  servicePrice: { fontSize: 16, fontWeight: '800', color: '#374151' },
  serviceCheck: { color: '#1B8A5A', fontSize: 16, fontWeight: '700' },
  bottomBar: { backgroundColor: '#1A3A6B', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  bottomTotal: { color: '#F5A623', fontSize: 18, fontWeight: '800' },
  bottomDur: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  nextBtn: { backgroundColor: '#F5A623', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  nextBtnFull: { backgroundColor: '#1A3A6B', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  profCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: 'transparent' },
  profCardActive: { borderColor: '#1A3A6B' },
  profAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A3A6B', alignItems: 'center', justifyContent: 'center' },
  profAvatarText: { color: '#fff', fontWeight: '700', fontSize: 20 },
  profInfo: { flex: 1 },
  profName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  profRole: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  daysRow: { marginBottom: 16 },
  dayBtn: { width: 56, height: 68, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 2, borderColor: '#E5E7EB' },
  dayBtnActive: { backgroundColor: '#1A3A6B', borderColor: '#1A3A6B' },
  dayName: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'capitalize' },
  dayNum: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 2 },
  slotsLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 10 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB' },
  slotBtnActive: { backgroundColor: '#1A3A6B', borderColor: '#1A3A6B' },
  slotText: { fontWeight: '600', color: '#374151', fontSize: 14 },
  slotTextActive: { color: '#fff' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, borderWidth: 1.5, borderColor: '#E5E7EB', color: '#111827' },
  confirmCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  confirmLabel: { fontSize: 13, color: '#6B7280' },
  confirmValue: { fontSize: 13, color: '#111827', fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 16 },
  confirmValueBold: { fontWeight: '800', color: '#1A3A6B', fontSize: 15 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F8F6F2' },
  successEmoji: { fontSize: 72 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 16, textAlign: 'center' },
  successSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  successCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 24, width: '100%', gap: 8 },
  successInfo: { fontSize: 14, color: '#374151', fontWeight: '500' },
  successBtn: { backgroundColor: '#1A3A6B', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginTop: 24 },
  successBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
