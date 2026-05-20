import { useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native'
import { useRouter } from 'expo-router'

const FAQ = [
  {
    q: 'Como cadastrar um novo cliente?',
    a: 'Vá em Clientes (tab inferior) → toque em "+ Novo". Preencha nome e WhatsApp. Você também pode cadastrar diretamente ao criar um novo agendamento na tela "+ Agendar" da Agenda.',
  },
  {
    q: 'Como criar um agendamento?',
    a: 'Vá em Agenda (tab inferior) → toque em "+ Agendar" no canto superior direito. Siga os 5 passos: escolha o cliente, serviços, profissional, data/hora e confirme.',
  },
  {
    q: 'Como configurar horários de funcionamento?',
    a: 'Mais → Configurações → Horários de funcionamento. Você pode marcar quais dias da semana estão abertos e definir abertura/fechamento por dia.',
  },
  {
    q: 'Como funciona a comissão dos profissionais?',
    a: 'Em Mais → Profissionais, cada profissional tem um campo "Comissão %". Esse é o percentual sobre o valor do serviço que ele recebe. Os relatórios financeiros calculam automaticamente.',
  },
  {
    q: 'O cliente recebe confirmação por WhatsApp?',
    a: 'Sim, no plano Pro a confirmação é automática. Em planos inferiores você pode enviar manualmente clicando no botão WhatsApp dentro do agendamento.',
  },
  {
    q: 'Como funciona o programa de fidelidade?',
    a: 'Mais → Fidelidade. Configure quantas visitas valem um prêmio (ex: 10 visitas = 1 corte grátis). A cada agendamento concluído, dê um carimbo manual ao cliente. Quando atingir a meta, o sistema avisa pra você resgatar.',
  },
  {
    q: 'Posso ter mais de uma barbearia/unidade?',
    a: 'Múltiplas unidades estão disponíveis no plano Premium. Cada unidade tem agenda, equipe e estoque independentes.',
  },
  {
    q: 'Como gerar relatórios financeiros?',
    a: 'Use a tab Financeiro. Você pode filtrar por período e exportar PDF/CSV. Relatórios avançados (DRE, lucro por profissional) estão no plano Pro.',
  },
  {
    q: 'Esqueci minha senha. Como recupero?',
    a: 'Na tela de login, toque em "Esqueci minha senha". Atualmente a recuperação é feita pelo painel web (app.stylogestor.com.br) — vamos adicionar dentro do app em breve.',
  },
]

export default function AjudaScreen() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleContactWhatsApp = () => {
    const phone = '5511999999999' // troque por número real de suporte
    const msg = encodeURIComponent('Olá! Preciso de ajuda no app STYLOGESTOR.')
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`).catch(() =>
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.'),
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ajuda</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ padding: 12 }}>

        {/* Quick contact */}
        <View style={s.quickCard}>
          <Text style={s.quickTitle}>Precisa de ajuda agora?</Text>
          <Text style={s.quickSub}>Nosso time responde em até 1h dias úteis.</Text>
          <View style={s.quickActions}>
            <TouchableOpacity style={[s.quickBtn, { backgroundColor: '#1B8A5A' }]} onPress={handleContactWhatsApp}>
              <Text style={s.quickBtnText}>💬 WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.quickBtn, { backgroundColor: '#1A3A6B' }]} onPress={() => router.push('/suporte' as never)}>
              <Text style={s.quickBtnText}>🎧 Abrir chamado</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <Text style={s.sectionTitle}>Perguntas frequentes</Text>
        {FAQ.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={s.faqCard}
            onPress={() => setOpenFaq(openFaq === i ? null : i)}
          >
            <View style={s.faqHead}>
              <Text style={s.faqQ}>{item.q}</Text>
              <Text style={s.faqChevron}>{openFaq === i ? '−' : '+'}</Text>
            </View>
            {openFaq === i && (
              <Text style={s.faqA}>{item.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        <Text style={s.footerText}>
          Não achou sua dúvida? Use o botão WhatsApp acima ou abra um chamado.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F6F2' },
  header: { backgroundColor: '#1A3A6B', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  back: { color: '#F5A623', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 },
  scroll: { flex: 1 },
  quickCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16 },
  quickTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  quickSub: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  quickActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  quickBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  quickBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginHorizontal: 4 },
  faqCard: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 6 },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQ: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 },
  faqChevron: { fontSize: 22, color: '#1A3A6B', fontWeight: '700' },
  faqA: { fontSize: 13, color: '#374151', lineHeight: 19, marginTop: 8 },
  footerText: { fontSize: 12, color: '#6B7280', textAlign: 'center', paddingHorizontal: 16, marginTop: 16, lineHeight: 18 },
})
