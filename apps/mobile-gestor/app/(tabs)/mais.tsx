import { ScrollView, View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'

const MENU = [
  {
    title: 'Gestão',
    items: [
      { icon: '✂️', label: 'Profissionais',   desc: 'Gerencie sua equipe',           route: '/profissionais' },
      { icon: '📋', label: 'Serviços',         desc: 'Cardápio e preços',             route: '/servicos' },
      { icon: '📦', label: 'Estoque',          desc: 'Produtos e insumos',            route: '/estoque' },
      { icon: '⭐', label: 'Fidelidade',       desc: 'Programa de pontos',            route: '/fidelidade' },
    ],
  },
  {
    title: 'Conta',
    items: [
      { icon: '⚙️', label: 'Configurações',   desc: 'Barbearia e horários',          route: '/configuracoes' },
      { icon: '💳', label: 'Plano atual',      desc: 'Pro · Renova em 10/06',         route: '/planos' },
      { icon: '❓', label: 'Ajuda',            desc: 'Central de suporte',            route: '/ajuda' },
      { icon: '🎧', label: 'Abrir chamado',   desc: 'Falar com o suporte',           route: '/suporte' },
    ],
  },
]

export default function MaisScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>J</Text>
        </View>
        <View>
          <Text style={s.name}>João Silva</Text>
          <Text style={s.plan}>✓ Plano Pro</Text>
        </View>
        <TouchableOpacity style={s.editBtn}>
          <Text style={s.editBtnText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {MENU.map((section) => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <View style={s.card}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[s.menuItem, idx < section.items.length - 1 && s.menuItemBorder]}
                >
                  <View style={s.menuIcon}>
                    <Text style={s.menuIconText}>{item.icon}</Text>
                  </View>
                  <View style={s.menuInfo}>
                    <Text style={s.menuLabel}>{item.label}</Text>
                    <Text style={s.menuDesc}>{item.desc}</Text>
                  </View>
                  <Text style={s.menuArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={s.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <Text style={s.version}>STYLOGESTOR v1.0.0</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F6F2' },
  header: {
    backgroundColor: '#1A3A6B', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5A623',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#1A3A6B', fontWeight: '900', fontSize: 22 },
  name: { color: '#fff', fontSize: 16, fontWeight: '700' },
  plan: { color: '#F5A623', fontSize: 12, fontWeight: '600', marginTop: 2 },
  editBtn: {
    marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  editBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  scroll: { padding: 12 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  menuIconText: { fontSize: 18 },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  menuDesc: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  menuArrow: { fontSize: 20, color: '#9CA3AF' },
  logoutBtn: {
    backgroundColor: '#FEE2E2', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
  },
  logoutText: { color: '#991B1B', fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 16 },
})
