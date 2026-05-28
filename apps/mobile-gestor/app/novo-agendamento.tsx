import { useCallback, useEffect, useState } from 'react'
import {
  ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { addDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { loadArray } from '../lib/storage'
import { listClientes, addCliente, type Cliente } from '../lib/clientes'
import { addAgendamento } from '../lib/agendamentos'

type Servico = { id: string; nome: string; duracao: number; preco: number; categoria: string; ativo: boolean }
type Profissional = { id: string; nome: string; role: string; telefone: string; comissaoPct: number; ativo: boolean }

type Step = 'cliente' | 'servicos' | 'profissional' | 'datetime' | 'confirm'

const SLOTS = ['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']
const DAYS = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i))

function maskPhone(value: string): string {
  let d = value.replace(/\D/g, '')
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2)
  d = d.slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`
}

export default function NovoAgendamentoScreen() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('cliente')

  // Data sources
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])

  // Form state
  const [clienteId, setClienteId] = useState<string>('')
  const [novoClienteNome, setNovoClienteNome] = useState('')
  const [novoClienteFone, setNovoClienteFone] = useState('')
  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [busca, setBusca] = useState('')

  const [selectedServicos, setSelectedServicos] = useState<string[]>([])
  const [profissionalId, setProfissionalId] = useState<string>('')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [observacao, setObservacao] = useState('')

  useFocusEffect(useCallback(() => {
    listClientes().then(setClientes)
    loadArray<Servico>('servicos_v1').then((list) => setServicos(list.filter((sv) => sv.ativo)))
    loadArray<Profissional>('profissionais_v1').then((list) => setProfissionais(list.filter((p) => p.ativo)))
  }, []))

  // Derived totals
  const clientePicked = clientes.find((c) => c.id === clienteId)
  const servicosPicked = servicos.filter((s) => selectedServicos.includes(s.id))
  const profissionalPicked = profissionais.find((p) => p.id === profissionalId)
  const total = servicosPicked.reduce((sum, s) => sum + s.preco, 0)
  const duracao = servicosPicked.reduce((sum, s) => sum + s.duracao, 0)
  const stepNum = { cliente: 1, servicos: 2, profissional: 3, datetime: 4, confirm: 5 }[step]

  const handleCriarCliente = async () => {
    if (!novoClienteNome.trim()) {
      Alert.alert('Atenção', 'Informe o nome.')
      return
    }
    const novo = await addCliente({ name: novoClienteNome, phone: novoClienteFone })
    setClientes((prev) => [novo, ...prev])
    setClienteId(novo.id)
    setShowNovoCliente(false)
    setNovoClienteNome('')
    setNovoClienteFone('')
    setStep('servicos')
  }

  const handleConfirmar = async () => {
    if (!clientePicked || !profissionalPicked || !selectedDay || !selectedSlot || servicosPicked.length === 0) {
      Alert.alert('Atenção', 'Algum dado está faltando.')
      return
    }
    await addAgendamento({
      date: format(selectedDay, 'dd/MM'),
      time: selectedSlot,
      clienteId: clientePicked.id,
      clienteNome: clientePicked.name,
      servicoIds: servicosPicked.map((s) => s.id),
      servicoNomes: servicosPicked.map((s) => s.nome).join(' + '),
      profissionalId: profissionalPicked.id,
      profissionalNome: profissionalPicked.nome,
      price: total,
      duration: duracao,
      observacao: observacao.trim() || undefined,
    })
    Alert.alert('Agendado com sucesso!', `${clientePicked.name} · ${format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })} às ${selectedSlot}`, [
      { text: 'OK', onPress: () => router.replace('/(tabs)/agenda') },
    ])
  }

  const clientesFiltered = busca
    ? clientes.filter((c) => c.name.toLowerCase().includes(busca.toLowerCase()) || c.phone.includes(busca))
    : clientes

  const goBack = () => {
    if (step === 'cliente') {
      router.back()
      return
    }
    if (step === 'servicos')     setStep('cliente')
    else if (step === 'profissional') setStep('servicos')
    else if (step === 'datetime')     setStep('profissional')
    else if (step === 'confirm')      setStep('datetime')
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={goBack}>
          <Text style={s.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Novo agendamento</Text>
      </View>

      {/* Progress */}
      <View style={s.progress}>
        {[1, 2, 3, 4, 5].map((n) => (
          <View key={n} style={[s.progressDot, n <= stepNum && s.progressDotActive]} />
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={s.scroll}>

          {/* STEP 1: Cliente */}
          {step === 'cliente' && (
            <View>
              <Text style={s.stepTitle}>Escolha o cliente</Text>

              {showNovoCliente ? (
                <View style={s.card}>
                  <Text style={s.label}>Nome *</Text>
                  <TextInput
                    style={s.input}
                    value={novoClienteNome}
                    onChangeText={setNovoClienteNome}
                    placeholder="Nome do cliente"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                  />
                  <Text style={s.label}>WhatsApp</Text>
                  <TextInput
                    style={s.input}
                    value={novoClienteFone}
                    onChangeText={(v) => setNovoClienteFone(maskPhone(v))}
                    placeholder="(11) 99999-9999"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <TouchableOpacity style={[s.btnGhost, { flex: 1 }]} onPress={() => setShowNovoCliente(false)}>
                      <Text style={s.btnGhostText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={handleCriarCliente}>
                      <Text style={s.btnText}>+ Cadastrar e continuar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <TextInput
                    style={[s.input, { marginBottom: 8 }]}
                    value={busca}
                    onChangeText={setBusca}
                    placeholder="🔍 Buscar por nome ou telefone..."
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity style={s.novoClienteBtn} onPress={() => setShowNovoCliente(true)}>
                    <Text style={s.novoClienteBtnText}>+ Cadastrar novo cliente</Text>
                  </TouchableOpacity>

                  {clientesFiltered.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[s.clienteCard, clienteId === c.id && s.clienteCardActive]}
                      onPress={() => { setClienteId(c.id); setTimeout(() => setStep('servicos'), 200) }}
                    >
                      <View style={s.clienteAvatar}>
                        <Text style={s.clienteAvatarText}>{c.name.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.clienteNome}>{c.name}</Text>
                        <Text style={s.clienteFone}>{c.phone} · {c.visits} visitas</Text>
                      </View>
                      {c.tags.length > 0 && c.tags.map((t) => (
                        <View key={t} style={s.clienteTag}>
                          <Text style={s.clienteTagText}>{t}</Text>
                        </View>
                      ))}
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          )}

          {/* STEP 2: Serviços */}
          {step === 'servicos' && (
            <View>
              <Text style={s.stepTitle}>Escolha os serviços</Text>
              {servicos.length === 0 ? (
                <View style={s.warningCard}>
                  <Text style={s.warningText}>
                    Nenhum serviço cadastrado. Cadastre em Mais → Serviços antes de criar agendamentos.
                  </Text>
                </View>
              ) : servicos.map((sv) => {
                const sel = selectedServicos.includes(sv.id)
                return (
                  <TouchableOpacity
                    key={sv.id}
                    style={[s.servicoCard, sel && s.servicoCardActive]}
                    onPress={() => setSelectedServicos((prev) =>
                      prev.includes(sv.id) ? prev.filter((x) => x !== sv.id) : [...prev, sv.id]
                    )}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.servicoNome}>{sv.nome}</Text>
                      <Text style={s.servicoDur}>{sv.categoria} · {sv.duracao} min</Text>
                    </View>
                    <Text style={[s.servicoPreco, sel && { color: '#1A3A6B' }]}>R$ {sv.preco}</Text>
                    {sel && <Text style={s.servicoCheck}>✓</Text>}
                  </TouchableOpacity>
                )
              })}
              {selectedServicos.length > 0 && (
                <View style={s.bottomBar}>
                  <View>
                    <Text style={s.bottomTotal}>R$ {total}</Text>
                    <Text style={s.bottomDur}>{selectedServicos.length} serviço(s) · {duracao} min</Text>
                  </View>
                  <TouchableOpacity style={s.nextBtn} onPress={() => setStep('profissional')}>
                    <Text style={s.nextBtnText}>Próximo →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* STEP 3: Profissional */}
          {step === 'profissional' && (
            <View>
              <Text style={s.stepTitle}>Escolha o profissional</Text>
              {profissionais.length === 0 ? (
                <View style={s.warningCard}>
                  <Text style={s.warningText}>
                    Nenhum profissional cadastrado. Cadastre em Mais → Profissionais.
                  </Text>
                </View>
              ) : profissionais.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[s.profCard, profissionalId === p.id && s.profCardActive]}
                  onPress={() => { setProfissionalId(p.id); setTimeout(() => setStep('datetime'), 200) }}
                >
                  <View style={s.profAvatar}><Text style={s.profAvatarText}>{p.nome.charAt(0)}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.profNome}>{p.nome}</Text>
                    <Text style={s.profRole}>{p.role}</Text>
                  </View>
                  {profissionalId === p.id && <Text style={{ color: '#1B8A5A', fontSize: 22 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* STEP 4: Data + Hora */}
          {step === 'datetime' && (
            <View>
              <Text style={s.stepTitle}>Data e horário</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.daysRow}>
                {DAYS.map((d) => {
                  const sel = selectedDay?.toDateString() === d.toDateString()
                  return (
                    <TouchableOpacity
                      key={d.toISOString()}
                      style={[s.dayBtn, sel && s.dayBtnActive]}
                      onPress={() => setSelectedDay(d)}
                    >
                      <Text style={[s.dayName, sel && { color: '#fff' }]}>
                        {format(d, 'EEE', { locale: ptBR }).slice(0, 3)}
                      </Text>
                      <Text style={[s.dayNum, sel && { color: '#fff' }]}>{format(d, 'd')}</Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>

              {selectedDay && (
                <>
                  <Text style={s.slotsLabel}>Horários disponíveis</Text>
                  <View style={s.slotsGrid}>
                    {SLOTS.map((slot) => (
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
                <TouchableOpacity style={s.nextBtnFull} onPress={() => setStep('confirm')}>
                  <Text style={s.nextBtnText}>Próximo →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* STEP 5: Confirmar */}
          {step === 'confirm' && (
            <View>
              <Text style={s.stepTitle}>Confirme o agendamento</Text>
              <View style={s.confirmCard}>
                {[
                  { label: 'Cliente',      value: clientePicked?.name ?? '-' },
                  { label: 'WhatsApp',     value: clientePicked?.phone ?? '-' },
                  { label: 'Serviços',     value: servicosPicked.map((sv) => sv.nome).join(', ') || '-' },
                  { label: 'Profissional', value: profissionalPicked?.nome ?? '-' },
                  { label: 'Data',         value: selectedDay ? format(selectedDay, "d 'de' MMMM", { locale: ptBR }) : '-' },
                  { label: 'Horário',      value: selectedSlot || '-' },
                  { label: 'Duração',      value: `${duracao} min` },
                  { label: 'Total',        value: `R$ ${total}`, bold: true },
                ].map((row) => (
                  <View key={row.label} style={s.confirmRow}>
                    <Text style={s.confirmLabel}>{row.label}</Text>
                    <Text style={[s.confirmValue, row.bold && s.confirmValueBold]}>{row.value}</Text>
                  </View>
                ))}
              </View>

              <Text style={s.label}>Observação (opcional)</Text>
              <TextInput
                style={[s.input, { minHeight: 60 }]}
                value={observacao}
                onChangeText={setObservacao}
                placeholder="Ex: cliente pediu desconto, prefere janela aberta..."
                placeholderTextColor="#9CA3AF"
                multiline
              />

              <TouchableOpacity style={[s.nextBtnFull, { backgroundColor: '#1B8A5A' }]} onPress={handleConfirmar}>
                <Text style={s.nextBtnText}>✓ Confirmar agendamento</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
  header: { backgroundColor: '#1A3A6B', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 16 },
  back: { color: '#F5A623', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  progress: { backgroundColor: '#1A3A6B', flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 14 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressDotActive: { backgroundColor: '#F5A623', width: 20 },
  scroll: { flex: 1, padding: 16 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  novoClienteBtn: { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#1A3A6B', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  novoClienteBtnText: { color: '#1A3A6B', fontWeight: '700', fontSize: 14 },
  clienteCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: 'transparent' },
  clienteCardActive: { borderColor: '#1A3A6B', backgroundColor: '#EFF6FF' },
  clienteAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A3A6B', alignItems: 'center', justifyContent: 'center' },
  clienteAvatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  clienteNome: { fontSize: 14, fontWeight: '700', color: '#111827' },
  clienteFone: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  clienteTag: { backgroundColor: '#FEF9C3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  clienteTagText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  warningCard: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D', borderRadius: 12, padding: 14 },
  warningText: { color: '#92400E', fontSize: 13, lineHeight: 18 },
  servicoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 6, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  servicoCardActive: { borderColor: '#1A3A6B', backgroundColor: '#EFF6FF' },
  servicoNome: { fontSize: 14, fontWeight: '600', color: '#111827' },
  servicoDur: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  servicoPreco: { fontSize: 15, fontWeight: '800', color: '#374151', marginRight: 8 },
  servicoCheck: { color: '#1B8A5A', fontSize: 18, fontWeight: '700' },
  bottomBar: { backgroundColor: '#1A3A6B', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  bottomTotal: { color: '#F5A623', fontSize: 18, fontWeight: '800' },
  bottomDur: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  nextBtn: { backgroundColor: '#F5A623', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  nextBtnFull: { backgroundColor: '#1A3A6B', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  profCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderColor: 'transparent' },
  profCardActive: { borderColor: '#1A3A6B' },
  profAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A3A6B', alignItems: 'center', justifyContent: 'center' },
  profAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  profNome: { fontSize: 14, fontWeight: '600', color: '#111827' },
  profRole: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  daysRow: { marginBottom: 16 },
  dayBtn: { width: 56, height: 68, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1.5, borderColor: '#E5E7EB' },
  dayBtnActive: { backgroundColor: '#1A3A6B', borderColor: '#1A3A6B' },
  dayName: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'capitalize' },
  dayNum: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 2 },
  slotsLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 10 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB' },
  slotBtnActive: { backgroundColor: '#1A3A6B', borderColor: '#1A3A6B' },
  slotText: { fontWeight: '600', color: '#374151', fontSize: 13 },
  slotTextActive: { color: '#fff' },
  confirmCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  confirmLabel: { fontSize: 12, color: '#6B7280' },
  confirmValue: { fontSize: 13, color: '#111827', fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 12 },
  confirmValueBold: { fontWeight: '800', color: '#1A3A6B', fontSize: 15 },
  btn: { backgroundColor: '#1A3A6B', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnGhost: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnGhostText: { color: '#374151', fontWeight: '600', fontSize: 14 },
})
