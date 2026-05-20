import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useUser } from '@clerk/clerk-expo'

function onlyLetters(value: string): string {
  return value.replace(/[^\p{L}\s'-]/gu, '')
}

export default function EditarPerfilScreen() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '')
      setLastName(user.lastName ?? '')
    }
  }, [user])

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Atenção', 'Primeiro nome é obrigatório.')
      return
    }
    if (!user) return
    setSaving(true)
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })
      Alert.alert('Salvo', 'Perfil atualizado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err) {
      const msg = (err as { errors?: Array<{ longMessage?: string }> })?.errors?.[0]?.longMessage
        ?? 'Não foi possível atualizar o perfil. Tente novamente.'
      Alert.alert('Erro', msg)
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded) {
    return (
      <View style={[s.safe, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A3A6B' }]}>
        <ActivityIndicator color="#F5A623" size="large" />
      </View>
    )
  }

  if (!user) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Editar perfil</Text>
        </View>
        <View style={s.empty}>
          <Text style={s.emptyText}>Você precisa estar logado para editar o perfil.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Editar perfil</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16 }}>

          <View style={s.avatarSection}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{(firstName || user.primaryEmailAddress?.emailAddress || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={s.emailLabel}>{user.primaryEmailAddress?.emailAddress}</Text>
          </View>

          <Text style={s.label}>Primeiro nome *</Text>
          <TextInput
            style={s.input}
            value={firstName}
            onChangeText={(v) => setFirstName(onlyLetters(v))}
            placeholder="João"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
          />

          <Text style={s.label}>Sobrenome</Text>
          <TextInput
            style={s.input}
            value={lastName}
            onChangeText={(v) => setLastName(onlyLetters(v))}
            placeholder="Silva"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
          />

          <View style={s.infoBox}>
            <Text style={s.infoText}>
              ℹ️ E-mail e senha são gerenciados pela Clerk (provedor de autenticação). Para mudar e-mail ou senha, use o painel web em app.stylogestor.com.br/conta.
            </Text>
          </View>

          <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Salvar alterações</Text>}
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
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#1A3A6B', fontSize: 40, fontWeight: '900' },
  emailLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginTop: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  infoBox: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginTop: 20 },
  infoText: { fontSize: 12, color: '#1A3A6B', lineHeight: 18 },
  saveBtn: { backgroundColor: '#1A3A6B', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#6B7280', fontSize: 14, textAlign: 'center' },
})
