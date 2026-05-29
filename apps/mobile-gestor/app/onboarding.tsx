// Onboarding: primeiro acesso de um usuário sem barbearia (tenant).
//
// Fluxo (docs/MOBILE_FASE1_HANDOFF.md, passo 2):
//   bootstrapTenant() retornou { needsOnboarding: true } → o gate em
//   (tabs)/_layout.tsx redireciona pra cá. Aqui coletamos o mínimo pra criar
//   a barbearia (nome obrigatório) e chamamos onboardTenant(), que já fixa o
//   slug ativo. Depois voltamos pras tabs.

import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../lib/auth'
import { onboardTenant } from '../lib/tenant'
import { ApiError } from '../lib/api'

// Máscara visual (11) 99999-9999
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export default function OnboardingScreen() {
  const router = useRouter()
  const { signOut } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    const nome = name.trim()
    if (!nome) {
      Alert.alert('Atenção', 'Informe o nome da sua barbearia.')
      return
    }
    setSaving(true)
    try {
      // Só manda campos com valor (a API rejeita campos extras/vazios).
      await onboardTenant({
        name: nome,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(city.trim() ? { city: city.trim() } : {}),
      })
      // Slug já ficou ativo. Volta pras tabs — o gate revalida e libera.
      router.replace('/(tabs)')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        Alert.alert('Sessão expirada', 'Faça login novamente.')
        await signOut()
        return
      }
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Não foi possível criar a barbearia. Tente novamente.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = () => {
    Alert.alert('Sair da conta', 'Deseja sair e voltar ao login?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ])
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.logoArea}>
            <View style={s.logoBox}>
              <Text style={s.logoLetter}>S</Text>
            </View>
            <Text style={s.title}>Bem-vindo! 👋</Text>
            <Text style={s.subtitle}>
              Vamos criar a sua barbearia. Você pode ajustar tudo depois nas configurações.
            </Text>
          </View>

          <View style={s.form}>
            <Text style={s.label}>Nome da barbearia *</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Barbearia do João"
              placeholderTextColor="#9CA3AF"
              maxLength={60}
              autoFocus
            />

            <Text style={s.label}>Telefone (opcional)</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={(t) => setPhone(formatPhone(t))}
              placeholder="(11) 99999-9999"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={15}
            />

            <Text style={s.label}>Cidade (opcional)</Text>
            <TextInput
              style={s.input}
              value={city}
              onChangeText={setCity}
              placeholder="São Paulo"
              placeholderTextColor="#9CA3AF"
              maxLength={60}
            />

            <TouchableOpacity
              style={[s.btn, saving && s.btnDisabled]}
              onPress={handleCreate}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Criar barbearia</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={s.linkBtn} onPress={handleSignOut} disabled={saving}>
              <Text style={s.linkText}>Sair da conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 24 },
  logoArea: { alignItems: 'center', marginBottom: 28 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: '#F5A623',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  logoLetter: { fontSize: 32, fontWeight: '900', color: '#1A3A6B' },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  subtitle: {
    color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8,
    textAlign: 'center', lineHeight: 18, paddingHorizontal: 8,
  },
  form: { backgroundColor: '#fff', borderRadius: 24, padding: 24, gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  btn: {
    backgroundColor: '#1A3A6B', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkBtn: { alignItems: 'center', marginTop: 14 },
  linkText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
})
