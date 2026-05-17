import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSignUp } from '@clerk/clerk-expo'
import { clerkErrorMessage } from '../../lib/clerkErrors'

export default function CadastroScreen() {
  const router = useRouter()
  const { signUp, setActive, isLoaded } = useSignUp()
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    if (!isLoaded) return
    setLoading(true)
    try {
      await signUp.create({ emailAddress: email, password })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStep('verify')
    } catch (err) {
      Alert.alert('Erro no cadastro', clerkErrorMessage(err, 'Não foi possível criar a conta.'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!code) {
      Alert.alert('Atenção', 'Digite o código recebido por e-mail')
      return
    }
    if (!isLoaded) return
    setLoading(true)
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code })
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId })
        // Auth gate redireciona p/ /(tabs)
      } else {
        Alert.alert('Verificação incompleta', `Status: ${attempt.status}. Conclua pelo painel web.`)
      }
    } catch (err) {
      Alert.alert('Código inválido', clerkErrorMessage(err, 'Verifique o código e tente novamente.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.container}>
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
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoComplete="password-new"
              />

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

              <TouchableOpacity style={s.linkBtn} onPress={() => setStep('form')}>
                <Text style={s.linkText}>Voltar e corrigir e-mail</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={s.linkBtn} onPress={() => router.replace('/(auth)/login')}>
            <Text style={s.linkText}>Já tem conta? <Text style={{ fontWeight: '700' }}>Entrar</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
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
