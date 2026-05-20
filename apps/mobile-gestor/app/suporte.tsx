import { useState } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, Alert, Linking, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'

const CATEGORIAS = [
  '🐛 Bug / problema',
  '💡 Sugestão',
  '❓ Como faço',
  '💳 Cobrança / plano',
  '📞 Outro',
]

export default function SuporteScreen() {
  const router = useRouter()
  const [categoria, setCategoria] = useState('🐛 Bug / problema')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')

  const handleSend = () => {
    if (!titulo.trim() || !descricao.trim()) {
      Alert.alert('Atenção', 'Preencha título e descrição.')
      return
    }
    // MVP: envia via WhatsApp pré-formatado.
    // Production: POST para endpoint /api/support/tickets
    const phone = '5511999999999' // suporte
    const msg = encodeURIComponent(
      `*${categoria}*\n\n*Título:* ${titulo}\n\n*Descrição:*\n${descricao}\n\n---\nEnviado pelo app STYLOGESTOR Gestor`
    )
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`).catch(() =>
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.'),
    )
    setTimeout(() => {
      Alert.alert('Chamado registrado', 'Seu chamado foi enviado para o suporte. Vamos responder em até 24h úteis.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    }, 800)
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Abrir chamado</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={s.scroll} contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>

          <Text style={s.label}>Categoria</Text>
          <View style={s.catGrid}>
            {CATEGORIAS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.catBtn, categoria === c && s.catBtnActive]}
                onPress={() => setCategoria(c)}
              >
                <Text style={[s.catText, categoria === c && s.catTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Título *</Text>
          <TextInput
            style={s.input}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Resumo curto do problema"
            placeholderTextColor="#9CA3AF"
            maxLength={80}
          />
          <Text style={s.charCount}>{titulo.length}/80</Text>

          <Text style={s.label}>Descrição *</Text>
          <TextInput
            style={[s.input, { minHeight: 140, textAlignVertical: 'top' }]}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Descreva com detalhes. Em que tela aconteceu? Quais passos você fez?"
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
          />
          <Text style={s.charCount}>{descricao.length}/1000</Text>

          <View style={s.infoBox}>
            <Text style={s.infoText}>
              ℹ️ Seu chamado será encaminhado via WhatsApp para nossa equipe de suporte. Tempo de resposta: até 24h úteis (plano Pro: prioritário).
            </Text>
          </View>

          <TouchableOpacity style={s.sendBtn} onPress={handleSend}>
            <Text style={s.sendBtnText}>📤 Enviar chamado</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F6F2' },
  header: { backgroundColor: '#1A3A6B', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  back: { color: '#F5A623', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  scroll: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  catBtnActive: { borderColor: '#1A3A6B', backgroundColor: '#EFF6FF' },
  catText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  catTextActive: { color: '#1A3A6B', fontWeight: '700' },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  charCount: { fontSize: 10, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  infoBox: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginTop: 16 },
  infoText: { fontSize: 12, color: '#1A3A6B', lineHeight: 18 },
  sendBtn: { backgroundColor: '#1A3A6B', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
