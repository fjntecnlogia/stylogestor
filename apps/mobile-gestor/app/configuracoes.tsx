import { useCallback, useState } from 'react'
import {
  ScrollView, View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity,
  Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { loadObject, saveObject } from '../lib/storage'

type DayKey = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab'

type DayConfig = { open: boolean; abertura: string; fechamento: string }

type ConfigBarbearia = {
  nome: string
  endereco: string
  telefone: string
  cnpj: string
  horarios: Record<DayKey, DayConfig>
  intervaloMin: number
}

const DAY_LABELS: Record<DayKey, string> = {
  dom: 'Domingo', seg: 'Segunda', ter: 'Terça', qua: 'Quarta',
  qui: 'Quinta', sex: 'Sexta', sab: 'Sábado',
}

const DEFAULT_CONFIG: ConfigBarbearia = {
  nome: 'Minha Barbearia',
  endereco: '',
  telefone: '',
  cnpj: '',
  horarios: {
    dom: { open: false, abertura: '09:00', fechamento: '18:00' },
    seg: { open: true,  abertura: '09:00', fechamento: '18:00' },
    ter: { open: true,  abertura: '09:00', fechamento: '18:00' },
    qua: { open: true,  abertura: '09:00', fechamento: '18:00' },
    qui: { open: true,  abertura: '09:00', fechamento: '18:00' },
    sex: { open: true,  abertura: '09:00', fechamento: '19:00' },
    sab: { open: true,  abertura: '09:00', fechamento: '17:00' },
  },
  intervaloMin: 30,
}

const KEY = 'config_barbearia_v1'

// ─ Filtros de input ────────────────────────────────────────────────
function maskPhone(value: string): string {
  let digits = value.replace(/\D/g, '')
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2)
  digits = digits.slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

function maskCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

function maskTime(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 4)
  if (d.length === 0) return ''
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}:${d.slice(2)}`
}

export default function ConfiguracoesScreen() {
  const router = useRouter()
  const [config, setConfig] = useState<ConfigBarbearia>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)

  useFocusEffect(useCallback(() => {
    loadObject<ConfigBarbearia>(KEY, DEFAULT_CONFIG).then(setConfig)
  }, []))

  const handleSave = async () => {
    if (!config.nome.trim()) {
      Alert.alert('Atenção', 'Nome da barbearia é obrigatório.')
      return
    }
    setSaving(true)
    await saveObject(KEY, config)
    setSaving(false)
    Alert.alert('Salvo', 'Configurações atualizadas com sucesso.', [
      { text: 'OK', onPress: () => router.back() },
    ])
  }

  const updateDay = (day: DayKey, patch: Partial<DayConfig>) => {
    setConfig((c) => ({
      ...c,
      horarios: { ...c.horarios, [day]: { ...c.horarios[day], ...patch } },
    }))
  }

  const INTERVALS = [15, 30, 45, 60]

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Configurações</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* DADOS DA BARBEARIA */}
          <Text style={s.sectionTitle}>Dados da barbearia</Text>
          <View style={s.card}>
            <Text style={s.label}>Nome *</Text>
            <TextInput
              style={s.input}
              value={config.nome}
              onChangeText={(v) => setConfig((c) => ({ ...c, nome: v }))}
              placeholder="Nome do estabelecimento"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={s.label}>Endereço</Text>
            <TextInput
              style={s.input}
              value={config.endereco}
              onChangeText={(v) => setConfig((c) => ({ ...c, endereco: v }))}
              placeholder="Rua, número, bairro, cidade - UF"
              placeholderTextColor="#9CA3AF"
              multiline
            />

            <Text style={s.label}>Telefone / WhatsApp</Text>
            <TextInput
              style={s.input}
              value={config.telefone}
              onChangeText={(v) => setConfig((c) => ({ ...c, telefone: maskPhone(v) }))}
              placeholder="(11) 99999-9999"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={15}
            />

            <Text style={s.label}>CNPJ</Text>
            <TextInput
              style={s.input}
              value={config.cnpj}
              onChangeText={(v) => setConfig((c) => ({ ...c, cnpj: maskCNPJ(v) }))}
              placeholder="00.000.000/0000-00"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={18}
            />
          </View>

          {/* HORÁRIOS DE FUNCIONAMENTO */}
          <Text style={s.sectionTitle}>Horários de funcionamento</Text>
          <View style={s.card}>
            {(Object.keys(DAY_LABELS) as DayKey[]).map((day) => (
              <View key={day} style={s.dayRow}>
                <View style={s.dayLabelBox}>
                  <Text style={s.dayLabel}>{DAY_LABELS[day]}</Text>
                  <Switch
                    value={config.horarios[day].open}
                    onValueChange={(v) => updateDay(day, { open: v })}
                    trackColor={{ false: '#E5E7EB', true: '#1A3A6B' }}
                    thumbColor={config.horarios[day].open ? '#F5A623' : '#fff'}
                  />
                </View>
                {config.horarios[day].open && (
                  <View style={s.dayTimes}>
                    <TextInput
                      style={[s.input, s.timeInput]}
                      value={config.horarios[day].abertura}
                      onChangeText={(v) => updateDay(day, { abertura: maskTime(v) })}
                      placeholder="09:00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                    <Text style={s.dayDash}>até</Text>
                    <TextInput
                      style={[s.input, s.timeInput]}
                      value={config.horarios[day].fechamento}
                      onChangeText={(v) => updateDay(day, { fechamento: maskTime(v) })}
                      placeholder="18:00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* INTERVALO DE AGENDAMENTO */}
          <Text style={s.sectionTitle}>Intervalo de horários</Text>
          <View style={s.card}>
            <Text style={s.helpText}>
              De quanto em quanto tempo abre slots para agendamento (ex: a cada 30 min).
            </Text>
            <View style={s.intervalRow}>
              {INTERVALS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[s.intervalBtn, config.intervaloMin === m && s.intervalBtnActive]}
                  onPress={() => setConfig((c) => ({ ...c, intervaloMin: m }))}
                >
                  <Text style={[s.intervalText, config.intervaloMin === m && s.intervalTextActive]}>
                    {m} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>

        {/* Sticky save button */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={s.saveBtnText}>{saving ? 'Salvando...' : '✓ Salvar configurações'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F6F2' },
  header: {
    backgroundColor: '#1A3A6B', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  back: { color: '#F5A623', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16, marginHorizontal: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  dayRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dayLabelBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  dayTimes: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  timeInput: { flex: 1, textAlign: 'center' },
  dayDash: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  helpText: { fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 18 },
  intervalRow: { flexDirection: 'row', gap: 8 },
  intervalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  intervalBtnActive: { borderColor: '#1A3A6B', backgroundColor: '#EFF6FF' },
  intervalText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  intervalTextActive: { color: '#1A3A6B' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: '#F8F6F2', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  saveBtn: { backgroundColor: '#1A3A6B', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
