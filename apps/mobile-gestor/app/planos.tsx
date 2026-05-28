import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 'R$ 0',
    features: ['Até 50 agendamentos/mês', '1 profissional', 'Sem WhatsApp automático'],
    current: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 79',
    period: '/mês',
    features: ['Agendamentos ilimitados', 'Até 3 profissionais', 'WhatsApp manual', 'Suporte email'],
    current: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 149',
    period: '/mês',
    features: ['Tudo do Starter', 'Profissionais ilimitados', 'WhatsApp automático (lembretes)', 'Fidelidade ativa', 'Relatórios avançados', 'Suporte prioritário'],
    current: true, // mock: assume usuário está no Pro
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 249',
    period: '/mês',
    features: ['Tudo do Pro', 'Múltiplas unidades', 'API customizada', 'Onboarding dedicado', 'Suporte 24/7'],
    current: false,
  },
]

export default function PlanosScreen() {
  const router = useRouter()
  const planoAtual = PLANS.find((p) => p.current)

  const handleUpgrade = (planName: string) => {
    Alert.alert(
      `Mudar para ${planName}?`,
      'O upgrade é feito pelo painel web em app.stylogestor.com.br (cartão de crédito ou PIX). Quer abrir agora?',
      [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Abrir painel web', onPress: () => Linking.openURL('https://app.stylogestor.com.br/planos') },
      ],
    )
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Plano</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ padding: 12 }}>

        {/* CURRENT PLAN BANNER */}
        {planoAtual && (
          <View style={s.banner}>
            <View style={s.bannerIcon}>
              <Text style={s.bannerIconText}>✓</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.bannerLabel}>SEU PLANO ATUAL</Text>
              <Text style={s.bannerPlan}>{planoAtual.name}</Text>
              <Text style={s.bannerRenew}>Renova em 10/06/2026</Text>
            </View>
          </View>
        )}

        {/* PLANS */}
        <Text style={s.sectionTitle}>Comparar planos</Text>
        {PLANS.map((p) => (
          <View key={p.id} style={[s.card, p.highlight && s.cardHighlight, p.current && s.cardCurrent]}>
            <View style={s.cardHead}>
              <Text style={s.cardName}>{p.name}</Text>
              {p.current && <Text style={s.currentBadge}>ATUAL</Text>}
            </View>
            <View style={s.priceRow}>
              <Text style={s.price}>{p.price}</Text>
              {p.period && <Text style={s.period}>{p.period}</Text>}
            </View>
            <View style={{ marginTop: 10 }}>
              {p.features.map((f) => (
                <Text key={f} style={s.feature}>
                  ✓ {f}
                </Text>
              ))}
            </View>
            {!p.current && (
              <TouchableOpacity style={[s.btn, p.highlight && { backgroundColor: '#F5A623' }]} onPress={() => handleUpgrade(p.name)}>
                <Text style={[s.btnText, p.highlight && { color: '#1A3A6B' }]}>
                  {p.id === 'free' ? 'Voltar para Free' : `Migrar para ${p.name}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <Text style={s.footer}>
          Dúvidas sobre planos? Fale com nosso suporte em Mais → Ajuda → Falar com suporte.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A3A6B' },
  header: { backgroundColor: '#1A3A6B', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  back: { color: '#F5A623', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  scroll: { flex: 1 },
  banner: { backgroundColor: '#1A3A6B', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  bannerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center' },
  bannerIconText: { color: '#1A3A6B', fontSize: 22, fontWeight: '900' },
  bannerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  bannerPlan: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  bannerRenew: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 10, marginHorizontal: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: 'transparent' },
  cardHighlight: { borderColor: '#F5A623' },
  cardCurrent: { backgroundColor: '#EFF6FF', borderColor: '#1A3A6B' },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: 18, fontWeight: '800', color: '#111827' },
  currentBadge: { fontSize: 10, color: '#fff', backgroundColor: '#1A3A6B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: '700', letterSpacing: 0.5 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 6, gap: 4 },
  price: { fontSize: 28, fontWeight: '900', color: '#1A3A6B' },
  period: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  feature: { fontSize: 13, color: '#374151', lineHeight: 22 },
  btn: { backgroundColor: '#1A3A6B', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  footer: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 16, paddingHorizontal: 16, lineHeight: 18 },
})
