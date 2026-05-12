import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { router } from 'expo-router'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha')
      return
    }
    setLoading(true)
    // TODO: Clerk signIn
    setTimeout(() => {
      setLoading(false)
      router.replace('/(tabs)')
    }, 1000)
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.container}>
        {/* Logo */}
        <View style={s.logoArea}>
          <View style={s.logoBox}>
            <Text style={s.logoLetter}>S</Text>
          </View>
          <Text style={s.logoText}>STYLO<Text style={s.logoAccent}>GESTOR</Text></Text>
          <Text style={s.logoSub}>Gestão para barbearias</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          <Text style={s.label}>E-mail</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={s.label}>Senha</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
          />

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Entrar</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.linkBtn}>
            <Text style={s.linkText}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>© 2026 STYLOGESTOR</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: '#F5A623',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoLetter: { fontSize: 32, fontWeight: '900', color: '#1A3A6B' },
  logoText: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  logoAccent: { color: '#F5A623' },
  logoSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 },
  form: { backgroundColor: '#fff', borderRadius: 24, padding: 24, gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  btn: {
    backgroundColor: '#1A3A6B', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkBtn: { alignItems: 'center', marginTop: 12 },
  linkText: { color: '#1A3A6B', fontSize: 13, fontWeight: '600' },
  footer: { color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 32, fontSize: 12 },
})
