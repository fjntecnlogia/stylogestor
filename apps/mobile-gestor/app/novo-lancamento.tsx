import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { format } from 'date-fns'
import { addLancamento, type MetodoPagamento } from '../lib/lancamentos'

const METODOS: MetodoPagamento[] = ['PIX', 'Dinheiro', 'Cartão', 'Outro']

export default function NovoLancamentoScreen() {
  const router = useRouter()
  const [type, setType] = useState<'IN' | 'OUT'>('IN')
  const [desc, setDesc] = useState('')
  const [method, setMethod] = useState<MetodoPagamento>('PIX')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const valor = parseFloat(amount.replace(',', '.'))
    if (!desc.trim()) {
      Alert.alert('Atenção', 'Informe a descrição do lançamento.')
      return
    }
    if (!valor || valor <= 0 || isNaN(valor)) {
      Alert.alert('Atenção', 'Informe um valor válido maior que zero.')
      return
    }
    setSaving(true)
    try {
      const now = new Date()
      await addLancamento({
        type,
        desc: desc.trim(),
        method,
        amount: valor,
        date: format(now, 'dd/MM'),
        time: format(now, 'HH:mm'),
      })
      Alert.alert(
        type === 'IN' ? '✓ Entrada registrada' : '✓ Saída registrada',
        `R$ ${valor.toFixed(2).replace('.', ',')} — ${desc}`,
        [{ text: 'OK', onPress: () => router.back() }],
      )
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o lançamento. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={s.title}>Novo lançamento</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body}>
          {/* Tipo */}
          <Text style={s.label}>Tipo</Text>
          <View style={s.tabRow}>
            <TouchableOpacity
              style={[s.tabBtn, type === 'IN' && s.tabBtnInActive]}
              onPress={() => setType('IN')}
            >
              <Text style={[s.tabBtnText, type === 'IN' && { color: '#fff' }]}>↑ Entrada</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tabBtn, type === 'OUT' && s.tabBtnOutActive]}
              onPress={() => setType('OUT')}
            >
              <Text style={[s.tabBtnText, type === 'OUT' && { color: '#fff' }]}>↓ Saída</Text>
            </TouchableOpacity>
          </View>

          {/* Descrição */}
          <Text style={s.label}>Descrição</Text>
          <TextInput
            style={s.input}
            value={desc}
            onChangeText={setDesc}
            placeholder={type === 'IN' ? 'Ex: Venda de produto, gorjeta...' : 'Ex: Aluguel, conta de luz, produtos...'}
            placeholderTextColor="#9CA3AF"
            maxLength={80}
          />

          {/* Valor */}
          <Text style={s.label}>Valor (R$)</Text>
          <TextInput
            style={s.input}
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^\d.,]/g, ''))}
            placeholder="0,00"
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
          />

          {/* Método */}
          <Text style={s.label}>Forma de pagamento</Text>
          <View style={s.methodRow}>
            {METODOS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[s.methodBtn, method === m && s.methodBtnActive]}
                onPress={() => setMethod(m)}
              >
                <Text style={[s.methodBtnText, method === m && { color: '#fff', fontWeight: '700' }]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.submitBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={s.submitBtnText}>
              {saving ? 'Salvando...' : 'Registrar lançamento'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
  header: {
    backgroundColor: '#1A3A6B', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { color: '#fff', fontSize: 14, fontWeight: '600' },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 32 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  tabRow: { flexDirection: 'row', gap: 8 },
  tabBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
  },
  tabBtnInActive: { backgroundColor: '#1B8A5A', borderColor: '#1B8A5A' },
  tabBtnOutActive: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  input: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
  },
  methodBtnActive: { backgroundColor: '#1A3A6B', borderColor: '#1A3A6B' },
  methodBtnText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  submitBtn: {
    marginTop: 28, backgroundColor: '#F5A623', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnText: { color: '#1A3A6B', fontWeight: '800', fontSize: 15 },
})
