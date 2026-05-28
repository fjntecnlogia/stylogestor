import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useUser } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { authErrorMessage } from '../lib/authErrors'
import { pickAndUploadAvatar, removeAvatar } from '../lib/avatar'

function onlyLetters(value: string): string {
  return value.replace(/[^\p{L}\s'-]/gu, '')
}

export default function EditarPerfilScreen() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (user) {
      // user_metadata pode ter name salvo como "firstName" e "lastName",
      // ou como "name" (string completa). Tentamos os dois.
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>
      const metaFirst = (meta.firstName as string | undefined) ?? ''
      const metaLast = (meta.lastName as string | undefined) ?? ''
      const fullName = (meta.name as string | undefined) ?? ''
      const metaAvatar = (meta.avatar_url as string | undefined) ?? ''

      if (metaFirst || metaLast) {
        setFirstName(metaFirst)
        setLastName(metaLast)
      } else if (fullName) {
        const [first, ...rest] = fullName.split(' ')
        setFirstName(first ?? '')
        setLastName(rest.join(' '))
      }
      setAvatarUrl(metaAvatar)
    }
  }, [user])

  const handleAvatarPress = () => {
    if (!user) return

    const options: Array<{ text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }> = [
      { text: 'Tirar foto', onPress: () => handlePickAvatar('camera') },
      { text: 'Escolher da galeria', onPress: () => handlePickAvatar('library') },
    ]
    if (avatarUrl) {
      options.push({ text: 'Remover foto', style: 'destructive', onPress: handleRemoveAvatar })
    }
    options.push({ text: 'Cancelar', style: 'cancel' })

    Alert.alert('Foto de perfil', 'O que você deseja fazer?', options)
  }

  const handlePickAvatar = async (source: 'camera' | 'library') => {
    if (!user) return
    setUploadingAvatar(true)
    try {
      const url = await pickAndUploadAvatar(user.id, source)
      if (url) setAvatarUrl(url)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user) return
    setUploadingAvatar(true)
    try {
      const ok = await removeAvatar(user.id)
      if (ok) setAvatarUrl('')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Atenção', 'Primeiro nome é obrigatório.')
      return
    }
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        },
      })
      if (error) throw error
      Alert.alert('Salvo', 'Perfil atualizado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err) {
      Alert.alert('Erro', authErrorMessage(err, 'Não foi possível atualizar o perfil.'))
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
      <SafeAreaView style={s.safe} edges={['top']}>
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
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Editar perfil</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16 }}>

          <View style={s.avatarSection}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
              activeOpacity={0.8}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.avatar} />
              ) : (
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{(firstName || user.email || '?').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={s.avatarBadge}>
                {uploadingAvatar ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.avatarBadgeText}>📷</Text>
                )}
              </View>
            </TouchableOpacity>
            <Text style={s.avatarHint}>Toque para alterar a foto</Text>
            <Text style={s.emailLabel}>{user.email}</Text>
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
              ℹ️ E-mail e senha são gerenciados pelo provedor de autenticação. Para mudar e-mail ou senha, use o painel web em app.stylogestor.com.br/conta.
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
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
  header: { backgroundColor: '#1A3A6B', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  back: { color: '#F5A623', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  scroll: { flex: 1 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#1A3A6B', fontSize: 40, fontWeight: '900' },
  avatarBadge: {
    position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#1A3A6B', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarBadgeText: { fontSize: 14 },
  avatarHint: { fontSize: 12, color: '#1A3A6B', fontWeight: '600', marginTop: 10 },
  emailLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  infoBox: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginTop: 20 },
  infoText: { fontSize: 12, color: '#1A3A6B', lineHeight: 18 },
  saveBtn: { backgroundColor: '#1A3A6B', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#6B7280', fontSize: 14, textAlign: 'center' },
})
