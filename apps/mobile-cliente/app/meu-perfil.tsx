import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, TextInput, Alert,
  KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useCallback, useEffect, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { useAuth, useUser } from '../lib/auth'
import Constants from 'expo-constants'
import { loadPerfil, savePerfil, type Perfil } from '../lib/perfil'
import { pickAndUploadAvatar, removeAvatar } from '../lib/avatar'

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

// Mascara visual (XX) XXXXX-XXXX
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// Mascara CEP XXXXX-XXX
function formatCEP(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

export default function MeuPerfilScreen() {
  const { signOut } = useAuth()
  const { user } = useUser()
  const [perfil, setPerfilState] = useState<Perfil>({
    nome: '', telefone: '', endereco: '', complemento: '',
    bairro: '', cidade: '', estado: '', cep: '',
  })
  const [saving, setSaving] = useState(false)
  const [estadoModalOpen, setEstadoModalOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const reload = useCallback(async () => {
    const p = await loadPerfil()
    // Pre-fill nome do Supabase user_metadata se nao tiver salvo ainda
    if (!p.nome && user) {
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>
      const metaName = (meta.name as string | undefined)
        || [meta.firstName, meta.lastName].filter(Boolean).join(' ').trim()
      if (metaName) p.nome = metaName
    }
    if (!p.telefone && user?.phone) {
      p.telefone = formatPhone(user.phone)
    }
    setPerfilState(p)
    // avatar vem do user_metadata.avatar_url
    if (user) {
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>
      setAvatarUrl((meta.avatar_url as string | undefined) ?? '')
    }
  }, [user])

  useFocusEffect(useCallback(() => { reload() }, [reload]))

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

  const update = (k: keyof Perfil, v: string) => setPerfilState((p) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!perfil.nome.trim()) {
      Alert.alert('Atenção', 'Informe seu nome.')
      return
    }
    setSaving(true)
    try {
      await savePerfil(perfil)
      Alert.alert('Perfil salvo', 'Suas informações foram atualizadas.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = () => {
    Alert.alert('Sair da conta', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => { try { await signOut() } catch (_) {} } },
    ])
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={s.title}>Meu perfil</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Avatar + Email */}
          <View style={s.avatarBox}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
              activeOpacity={0.8}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.avatar} />
              ) : (
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{perfil.nome.charAt(0).toUpperCase() || '?'}</Text>
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
            <Text style={s.emailText}>{user?.email || ''}</Text>
          </View>

          {/* Form */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Dados pessoais</Text>

            <Text style={s.label}>Nome completo *</Text>
            <TextInput
              style={s.input}
              value={perfil.nome}
              onChangeText={(t) => update('nome', t.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
              placeholder="Seu nome"
              placeholderTextColor="#9CA3AF"
              maxLength={60}
            />

            <Text style={s.label}>WhatsApp</Text>
            <TextInput
              style={s.input}
              value={perfil.telefone}
              onChangeText={(t) => update('telefone', formatPhone(t))}
              placeholder="(11) 99999-9999"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Endereço (opcional)</Text>
            <Text style={s.sectionSub}>Útil pra encontrar barbearias próximas e organizar histórico.</Text>

            <Text style={s.label}>Endereço (rua + número)</Text>
            <TextInput
              style={s.input}
              value={perfil.endereco}
              onChangeText={(t) => update('endereco', t)}
              placeholder="Rua das Flores, 123"
              placeholderTextColor="#9CA3AF"
              maxLength={120}
            />

            <Text style={s.label}>Complemento</Text>
            <TextInput
              style={s.input}
              value={perfil.complemento}
              onChangeText={(t) => update('complemento', t)}
              placeholder="Apto 42, Bloco B"
              placeholderTextColor="#9CA3AF"
              maxLength={60}
            />

            <Text style={s.label}>Bairro</Text>
            <TextInput
              style={s.input}
              value={perfil.bairro}
              onChangeText={(t) => update('bairro', t)}
              placeholder="Centro"
              placeholderTextColor="#9CA3AF"
              maxLength={60}
            />

            <View style={s.row}>
              <View style={{ flex: 2 }}>
                <Text style={s.label}>Cidade</Text>
                <TextInput
                  style={s.input}
                  value={perfil.cidade}
                  onChangeText={(t) => update('cidade', t)}
                  placeholder="São Paulo"
                  placeholderTextColor="#9CA3AF"
                  maxLength={60}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>UF</Text>
                <TextInput
                  style={s.input}
                  value={perfil.estado}
                  onChangeText={(t) => update('estado', t.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))}
                  placeholder="SP"
                  placeholderTextColor="#9CA3AF"
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <Text style={s.label}>CEP</Text>
            <TextInput
              style={s.input}
              value={perfil.cep}
              onChangeText={(t) => update('cep', formatCEP(t))}
              placeholder="00000-000"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={9}
            />
          </View>

          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={s.saveBtnText}>{saving ? 'Salvando...' : '💾 Salvar perfil'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.logoutBtn} onPress={handleSignOut}>
            <Text style={s.logoutBtnText}>🚪 Sair da conta</Text>
          </TouchableOpacity>

          <Text style={s.versionText}>
            Agendar STYLOGESTOR v{Constants.expoConfig?.version ?? '1.0.0'} ({Constants.expoConfig?.android?.versionCode ?? '?'})
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
  header: {
    backgroundColor: '#1A3A6B', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { color: '#F5A623', fontSize: 16, fontWeight: '700' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1, backgroundColor: '#F8F6F2' },
  avatarBox: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff' },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1A3A6B',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: '#F5A623', fontWeight: '900', fontSize: 36 },
  avatarBadge: {
    position: 'absolute', right: -2, bottom: 8, width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarBadgeText: { fontSize: 13 },
  avatarHint: { fontSize: 12, color: '#1A3A6B', fontWeight: '600', marginBottom: 4 },
  emailText: { color: '#6B7280', fontSize: 13 },
  section: { padding: 16, marginTop: 12, backgroundColor: '#fff' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sectionSub: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#374151', marginTop: 10, marginBottom: 6 },
  input: {
    backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
    fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB',
  },
  row: { flexDirection: 'row', gap: 10 },
  saveBtn: {
    margin: 16, backgroundColor: '#1A3A6B', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  logoutBtn: {
    marginHorizontal: 16, backgroundColor: '#FEE2E2', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center',
  },
  logoutBtnText: { color: '#991B1B', fontWeight: '700', fontSize: 14 },
  versionText: {
    textAlign: 'center', color: '#9CA3AF', fontSize: 11, marginTop: 24, marginBottom: 8,
  },
})
