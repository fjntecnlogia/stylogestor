import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { authErrorMessage } from '../../lib/authErrors'

export default function CadastroScreen() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha')
      return
    }
    if (password.length < 8) {
      Alert.alert('Senha curta', 'Use no mínimo 8 caracteres.')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) {
        Alert.alert('Erro no cadastro', authErrorMessage(error, 'Não foi possível criar a conta.'))
        return
      }
      // Se "Confirm email" estiver ativo no Supabase, data.session é null e
      // o usuário precisa abrir o e-mail. Senão, signUp já loga direto.
      if (data.session) {
        // Caso "Confirm email" esteja desligado — vai direto pra tabs via AuthProvider
        return
      }
      // Avança pra tela de verificação OTP
      setStep('verify')
    } catch (err) {
      Alert.alert('Erro no cadastro', authErrorMessage(err, 'Não foi possível criar a conta.'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!code) {
      Alert.alert('Atenção', 'Digite o código recebido por e-mail')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code,
        type: 'signup',
      })
      if (error) {
        Alert.alert('Código inválido', authErrorMessage(error, 'Verifique o código e tente novamente.'))
        return
      }
      if (data.session) {
        // AuthProvider escuta onAuthStateChange e atualiza session.
        // Auth gate em app/index.tsx redireciona p/ /(tabs)
      } else {
        Alert.alert('Verificação incompleta', 'Tente novamente.')
      }
    } catch (err) {
      Alert.alert('Código inválido', authErrorMessage(err, 'Verifique o código e tente novamente.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      })
      if (error) throw error
      Alert.alert('Código reenviado', `Verifique novamente sua caixa de entrada em ${email}.`)
    } catch (err) {
      Alert.alert('Erro', authErrorMessage(err, 'Não foi possível reenviar o código.'))
    } finally {
      setLoading(false)
    }
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
          <Text style={s.logoText}>STYLO<Text style={s.logoAccent}>GESTOR</Text></Text>
          <Text style={s.logoSub}>
            {step === 'form' ? 'Criar conta' : 'Verificar e-mail'}
          </Text>
        </View>

        <View style={s.form}>
          {step === 'form' ? (
            <>
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

              <Text style={s.label}>Senha (mínimo 8 caracteres)</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.inputInner}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
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

              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleCreate} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Criar conta</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.helpText}>
                Enviamos um código de 6 dígitos para <Text style={{ fontWeight: '700' }}>{email}</Text>.
                Confira a caixa de entrada (e o spam).
              </Text>

              <Text style={s.label}>Código de verificação</Text>
              <TextInput
                style={[s.input, { fontSize: 22, letterSpacing: 4, textAlign: 'center' }]}
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleVerify} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verificar</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={s.linkBtn} onPress={handleResendCode} disabled={loading}>
                <Text style={s.linkText}>Reenviar código</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.linkBtn} onPress={() => setStep('form')}>
                <Text style={s.linkText}>Voltar e corrigir e-mail</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={s.linkBtn} onPress={() => router.replace('/(auth)/login')}>
            <Text style={s.linkText}>Já tem conta? <Text style={{ fontWeight: '700' }}>Entrar</Text></Text>
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
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: '#F5A623',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoLetter: { fontSize: 32, fontWeight: '900', color: '#1A3A6B' },
  logoText: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  logoAccent: { color: '#F5A623' },
  logoSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4, fontWeight: '600' },
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
  helpText: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 8 },
  btn: {
    backgroundColor: '#1A3A6B', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkBtn: { alignItems: 'center', marginTop: 12 },
  linkText: { color: '#1A3A6B', fontSize: 13, fontWeight: '600' },
})
