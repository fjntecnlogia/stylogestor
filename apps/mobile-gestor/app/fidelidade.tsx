import { useCallback, useState } from 'react'
import {
  ScrollView, View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity,
  Alert, Switch,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { loadObject, saveObject, loadArray, saveArray } from '../lib/storage'
import { listClientes, type Cliente } from '../lib/clientes'

type ProgramaConfig = {
  ativo: boolean
  tipo: 'carimbo' | 'pontos'
  metaVisitas: number
  premio: string
}

type ClienteStamps = {
  clienteId: string
  carimbos: number
}

const KEY_CFG = 'fidelidade_config_v1'
const KEY_STAMPS = 'fidelidade_stamps_v1'

const DEFAULT_CFG: ProgramaConfig = {
  ativo: true,
  tipo: 'carimbo',
  metaVisitas: 10,
  premio: '1 serviço grátis',
}

export default function FidelidadeScreen() {
  const router = useRouter()
  const [cfg, setCfg] = useState<ProgramaConfig>(DEFAULT_CFG)
  const [stamps, setStamps] = useState<ClienteStamps[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])

  useFocusEffect(useCallback(() => {
    loadObject<ProgramaConfig>(KEY_CFG, DEFAULT_CFG).then(setCfg)
    loadArray<ClienteStamps>(KEY_STAMPS).then(setStamps)
    listClientes().then(setClientes)
  }, []))

  const getStamps = (clienteId: string) => {
    return stamps.find((s) => s.clienteId === clienteId)?.carimbos ?? 0
  }

  const updateStamps = async (clienteId: string, delta: number) => {
    const atual = getStamps(clienteId)
    const novo = Math.max(0, Math.min(cfg.metaVisitas, atual + delta))
    const existing = stamps.some((s) => s.clienteId === clienteId)
    const updated = existing
      ? stamps.map((s) => (s.clienteId === clienteId ? { ...s, carimbos: novo } : s))
      : [...stamps, { clienteId, carimbos: novo }]
    setStamps(updated)
    await saveArray(KEY_STAMPS, updated)
  }

  const handleSaveCfg = async () => {
    if (!cfg.premio.trim()) {
      Alert.alert('Atenção', 'Defina o prêmio oferecido.')
      return
    }
    await saveObject(KEY_CFG, cfg)
    Alert.alert('Salvo', 'Configuração do programa atualizada.')
  }

  const handleResgatar = (cliente: Cliente) => {
    Alert.alert('Resgatar prêmio?', `${cliente.name} vai trocar ${cfg.metaVisitas} carimbos por: ${cfg.premio}`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Resgatar',
        onPress: async () => {
          await updateStamps(cliente.id, -cfg.metaVisitas)
          Alert.alert('Resgatado!', `Prêmio entregue para ${cliente.name}.`)
        },
      },
    ])
  }

  const totalParticipantes = stamps.filter((s) => s.carimbos > 0).length
  const promptosParaResgate = stamps.filter((s) => s.carimbos >= cfg.metaVisitas).length

  // Sort clientes by stamps DESC
  const ranking = [...clientes]
    .map((c) => ({ ...c, stampsCount: getStamps(c.id) }))
    .sort((a, b) => b.stampsCount - a.stampsCount)

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Fidelidade</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* CONFIG */}
        <Text style={s.sectionTitle}>⚙️ Configuração</Text>
        <View style={s.card}>
          <View style={s.rowToggle}>
            <View style={{ flex: 1 }}>
              <Text style={s.cfgLabel}>Programa ativo</Text>
              <Text style={s.cfgHelp}>Quando ligado, clientes acumulam carimbos a cada visita.</Text>
            </View>
            <Switch
              value={cfg.ativo}
              onValueChange={(v) => setCfg((c) => ({ ...c, ativo: v }))}
              trackColor={{ false: '#E5E7EB', true: '#1A3A6B' }}
              thumbColor={cfg.ativo ? '#F5A623' : '#fff'}
            />
          </View>

          <Text style={s.label}>Tipo</Text>
          <View style={s.tipoRow}>
            {(['carimbo', 'pontos'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.tipoBtn, cfg.tipo === t && s.tipoBtnActive]}
                onPress={() => setCfg((c) => ({ ...c, tipo: t }))}
              >
                <Text style={[s.tipoText, cfg.tipo === t && s.tipoTextActive]}>
                  {t === 'carimbo' ? '🎫 Carimbo' : '⭐ Pontos'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Visitas para ganhar prêmio</Text>
          <View style={s.row}>
            <TouchableOpacity
              style={s.stepperBtn}
              onPress={() => setCfg((c) => ({ ...c, metaVisitas: Math.max(3, c.metaVisitas - 1) }))}
            >
              <Text style={s.stepperText}>−</Text>
            </TouchableOpacity>
            <Text style={s.stepperValue}>{cfg.metaVisitas}</Text>
            <TouchableOpacity
              style={s.stepperBtn}
              onPress={() => setCfg((c) => ({ ...c, metaVisitas: Math.min(30, c.metaVisitas + 1) }))}
            >
              <Text style={s.stepperText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.label}>Prêmio oferecido</Text>
          <TextInput
            style={s.input}
            value={cfg.premio}
            onChangeText={(v) => setCfg((c) => ({ ...c, premio: v }))}
            placeholder="Ex: 1 serviço grátis"
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity style={s.saveBtn} onPress={handleSaveCfg}>
            <Text style={s.saveBtnText}>Salvar configuração</Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <Text style={s.sectionTitle}>📊 Resumo</Text>
        <View style={[s.card, { flexDirection: 'row', gap: 10 }]}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{totalParticipantes}</Text>
            <Text style={s.statLabel}>Participantes</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statValue, { color: '#F5A623' }]}>{promptosParaResgate}</Text>
            <Text style={s.statLabel}>Prontos pra resgate</Text>
          </View>
        </View>

        {/* RANKING */}
        <Text style={s.sectionTitle}>🏆 Clientes</Text>
        {ranking.length === 0 ? (
          <View style={s.card}>
            <Text style={s.emptyText}>Sem clientes cadastrados ainda.</Text>
          </View>
        ) : ranking.map((c) => {
          const sc = c.stampsCount
          const cheio = sc >= cfg.metaVisitas
          return (
            <View key={c.id} style={[s.clienteCard, cheio && { borderColor: '#F5A623' }]}>
              <View style={s.clienteHeader}>
                <View style={s.clienteAvatar}>
                  <Text style={s.clienteAvatarText}>{c.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.clienteNome}>{c.name}</Text>
                  <Text style={s.clienteFone}>{c.phone}</Text>
                </View>
                <Text style={[s.stampsCount, cheio && { color: '#F5A623' }]}>
                  {sc}/{cfg.metaVisitas}
                </Text>
              </View>

              {/* Visualização dos carimbos */}
              <View style={s.stampsRow}>
                {Array.from({ length: cfg.metaVisitas }).map((_, i) => (
                  <View
                    key={i}
                    style={[s.stamp, i < sc ? s.stampFull : s.stampEmpty]}
                  >
                    <Text style={[s.stampText, i < sc && { color: '#fff' }]}>{i < sc ? '✓' : ''}</Text>
                  </View>
                ))}
              </View>

              <View style={s.clienteActions}>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: '#1A3A6B' }]}
                  onPress={() => updateStamps(c.id, 1)}
                >
                  <Text style={s.actionBtnText}>+ Carimbo</Text>
                </TouchableOpacity>
                {sc > 0 && (
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' }]}
                    onPress={() => updateStamps(c.id, -1)}
                  >
                    <Text style={[s.actionBtnText, { color: '#6B7280' }]}>− Carimbo</Text>
                  </TouchableOpacity>
                )}
                {cheio && (
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: '#F5A623' }]}
                    onPress={() => handleResgatar(c)}
                  >
                    <Text style={[s.actionBtnText, { color: '#1A3A6B' }]}>🎁 Resgatar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F6F2' },
  header: { backgroundColor: '#1A3A6B', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  back: { color: '#F5A623', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16, marginHorizontal: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, marginBottom: 8 },
  rowToggle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cfgLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cfgHelp: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  tipoRow: { flexDirection: 'row', gap: 8 },
  tipoBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#F9FAFB' },
  tipoBtnActive: { borderColor: '#1A3A6B', backgroundColor: '#EFF6FF' },
  tipoText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tipoTextActive: { color: '#1A3A6B', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A3A6B', alignItems: 'center', justifyContent: 'center' },
  stepperText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  stepperValue: { fontSize: 22, fontWeight: '800', color: '#1A3A6B', minWidth: 40, textAlign: 'center' },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  saveBtn: { backgroundColor: '#1A3A6B', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1A3A6B' },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 4 },
  emptyText: { color: '#6B7280', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  clienteCard: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  clienteHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clienteAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A3A6B', alignItems: 'center', justifyContent: 'center' },
  clienteAvatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  clienteNome: { fontSize: 14, fontWeight: '700', color: '#111827' },
  clienteFone: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  stampsCount: { fontSize: 16, fontWeight: '800', color: '#1A3A6B' },
  stampsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 10 },
  stamp: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  stampFull: { backgroundColor: '#1A3A6B', borderColor: '#1A3A6B' },
  stampEmpty: { backgroundColor: '#fff', borderColor: '#D1D5DB' },
  stampText: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  clienteActions: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
})
