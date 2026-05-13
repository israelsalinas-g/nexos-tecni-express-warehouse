import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { useRouter } from 'expo-router'

const { width } = Dimensions.get('window')
const COLUMN_WIDTH = (width - 40 - 16) / 2

export default function SettingsScreen() {
  const router = useRouter()

  const menuItems = [
    {
      id: 'fiscal',
      title: 'Fiscal / CAI',
      icon: 'file-certificate-outline',
      color: '#f43f5e',
      route: '/auxiliaries/fiscal'
    },
    {
      id: 'company',
      title: 'Datos Empresa',
      icon: 'office-building-cog-outline',
      color: '#0ea5e9',
      route: '/auxiliaries/company'
    },
    {
      id: 'users',
      title: 'Usuarios',
      icon: 'shield-account-outline',
      color: '#6366f1',
      route: '/auxiliaries/users'
    }
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Configuraciones</Text>
          <Text style={styles.subtitle}>Ajustes y control administrativo</Text>
        </View>

        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.squareCard}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color={tokens.colors.primary} />
          <Text style={styles.infoText}>
            Configura los parámetros legales, fiscales y de acceso para garantizar el cumplimiento y la seguridad.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 32, marginTop: 10, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: tokens.colors.gray900, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: tokens.colors.gray600, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  squareCard: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadow.md,
  },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: tokens.colors.gray900, textAlign: 'center' },
  infoBox: {
    marginTop: 24,
    backgroundColor: tokens.colors.primary + '08',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.primary + '20',
  },
  infoText: { flex: 1, marginLeft: 12, fontSize: 13, color: tokens.colors.primary, lineHeight: 18 }
})
