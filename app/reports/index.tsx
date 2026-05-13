import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { tokens } from '@/theme/tokens'

const REPORTS = [
  {
    id: 'sales',
    title: 'Ventas',
    subtitle: 'Ingresos, métodos de pago y top productos',
    icon: 'chart-bar',
    color: '#3b82f6',
    route: '/reports/sales',
  },
  {
    id: 'inventory',
    title: 'Inventario',
    subtitle: 'Stock actual, bajos y valor de bodega',
    icon: 'package-variant-closed',
    color: '#8b5cf6',
    route: '/reports/inventory',
  },
  {
    id: 'customers',
    title: 'Clientes',
    subtitle: 'Nuevos, recurrentes y top compradores',
    icon: 'account-group-outline',
    color: '#0ea5e9',
    route: '/reports/customers',
  },
  {
    id: 'finance',
    title: 'Financiero',
    subtitle: 'Ingresos vs gastos y margen bruto',
    icon: 'finance',
    color: '#10b981',
    route: '/reports/finance',
  },
]

export default function ReportsScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportes</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Selecciona un reporte para ver análisis detallados con gráficos.</Text>

        {REPORTS.map(report => (
          <TouchableOpacity
            key={report.id}
            style={styles.card}
            onPress={() => router.push(report.route as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { backgroundColor: report.color + '18' }]}>
              <MaterialCommunityIcons name={report.icon as any} size={32} color={report.color} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{report.title}</Text>
              <Text style={styles.cardSub}>{report.subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={tokens.colors.gray400} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: tokens.spacing.md, paddingVertical: 12,
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100,
    gap: tokens.spacing.sm,
  },
  headerBack: { padding: 4 },
  headerTitle: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: tokens.colors.gray900 },
  content: { padding: tokens.spacing.md, gap: tokens.spacing.sm },
  subtitle: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray600, marginBottom: tokens.spacing.md },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md,
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl, padding: tokens.spacing.md,
    borderWidth: 1, borderColor: tokens.colors.gray100,
    ...tokens.shadow.md,
  },
  iconWrap: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  cardText: { flex: 1 },
  cardTitle: { fontSize: tokens.typography.size.base, fontWeight: '700', color: tokens.colors.gray900 },
  cardSub: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray600, marginTop: 3 },
})
