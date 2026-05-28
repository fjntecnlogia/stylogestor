import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { authErrorMessage } from '../../lib/authErrors'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) {
        Alert.alert('Erro ao entrar', authErrorMessage(error, 'Verifique suas credenciais.'))
        return
      }
      // AuthProvider escuta onAuthStateChange. Volta pra home.
      router.replace('/')
    } catch (err) {
      Alert.alert('Erro ao entrar', authErrorMessage(err, 'Verifique suas credenciais.'))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Informe o e-mail', 'Digite seu e-mail acima e toque novamente.')
      return
    }
    Alert.alert('Recuperar senha', `Enviar link de redefinição pra ${email.trim().toLowerCase()}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Enviar',
        onPress: async () => {
          try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase())
            if (error) throw error
            Alert.alert('Verifique seu e-mail', 'Enviamos um link pra redefinir a senha.')
          } catch (err) {
            Alert.alert('Erro', authErrorMessage(err, 'Não foi possível enviar o e-mail.'))
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.container}>
        {/* Voltar (sem login segue navegando) */}
        <TouchableOpacity style={s.skipBtn} onPress={() => router.replace('/')}>
          <Text style={s.skipText}>‹ Voltar e continuar sem conta</Text>
        </TouchableOpacity>

        <View style={s.logoArea}>
          <View style={s.logoBox}>
            <Text style={s.logoLetter}>S</Text>
          </View>
          <Text style={s.logoText}>STYLO<Text style={s.logoAccent}>GESTOR</Text></Text>
          <Text style={s.logoSub}>Entrar para agendar mais rápido</Text>
        </View>

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
            autoComplete="email"
          />

          <Text style={s.label}>Senha</Text>
          <View style={s.inputWrap}>
            <TextInput
              style={s.inputInner}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <Text style={s.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Entrar</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.linkBtn} onPress={handleForgotPassword}>
            <Text style={s.linkText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.linkBtn} onPress={() => router.push('/(auth)/cadastro')}>
            <Text style={s.linkText}>Não tem conta? <Text style={{ fontWeight: '700' }}>Cadastre-se</Text></Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>Login é opcional · você pode agendar sem cadastro</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  skipBtn: { position: 'absolute', top: 50, left: 20 },
  skipText: { color: '#F5A623', fontSize: 14, fontWeight: '600' },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: '#F5A623',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoLetter: { fontSize: 32, fontWeight: '900', color: '#1A3A6B' },
  logoText: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  logoAccent: { color: '#F5A623' },
  logoSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  form: { backgroundColor: '#fff', borderRadius: 24, padding: 24, gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  inputInner: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: '#111827',
  },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  eyeIcon: { fontSize: 18 },
  btn: {
    backgroundColor: '#1A3A6B', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkBtn: { alignItems: 'center', marginTop: 12 },
  linkText: { color: '#1A3A6B', fontSize: 13, fontWeight: '600' },
  footer: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 32, fontSize: 12 },
})
