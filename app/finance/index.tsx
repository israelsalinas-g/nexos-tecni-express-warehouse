import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ExpenseService } from '@/services/expense.service'
import { PayableService } from '@/services/payable.service'
import { BalanceService } from '@/services/balance.service'
import { tokens } from '@/theme/tokens'

interface KPI {
  label: string
  value: string
  sub?: string
  color: string
}

const MODULES = [
  { id: 'expenses',     title: 'Gastos',              subtitle: 'Egresos operativos', icon: 'receipt-text-outline', color: '#ef4444', route: '/finance/expenses/index' },
  { id: 'receivables',  title: 'Cuentas x Cobrar',   subtitle: 'Deudas de clientes', icon: 'account-arrow-right-outline', color: '#3b82f6', route: '/finance/receivables/index' },
  { id: 'payables',     title: 'Cuentas x Pagar',    subtitle: 'Deudas a proveedores', icon: 'account-arrow-left-outline', color: '#f59e0b', route: '/finance/payables/index' },
  { id: 'balance',      title: 'Balance',             subtitle: 'Flujo de caja', icon: 'chart-line', color: '#10b981', route: '/finance/balance/index' },
]

export default function FinanceScreen() {
  const router = useRouter()
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadKPIs() {
      try {
        const { from, to } = BalanceService.periodRange('month')
        const [expenseTotal, payableTotal, cashflow] = await Promise.all([
          ExpenseService.getTotalForPeriod(from, to),
          PayableService.getTotalPending(),
          BalanceService.getCashflow(from, to),
        ])

        setKpis([
          {
            label: 'Ingresos del Mes',
            value: `L. ${cashflow.income.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            color: '#10b981',
          },
          {
            label: 'Gastos del Mes',
            value: `L. ${expenseTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            color: '#ef4444',
          },
          {
            label: 'Balance Neto',
            value: `L. ${cashflow.net.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            color: cashflow.net >= 0 ? '#10b981' : '#ef4444',
          },
          {
            label: 'Por Pagar',
            value: `L. ${payableTotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            sub: 'a proveedores',
            color: '#f59e0b',
          },
        ])
      } catch {
        /* silently skip KPI errors */
      } finally {
        setLoading(false)
      }
    }
    loadKPIs()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finanzas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* KPI cards */}
        {loading ? (
          <View style={styles.kpiLoading}>
            <ActivityIndicator size="small" color={tokens.colors.primary} />
          </View>
        ) : (
          <View style={styles.kpiGrid}>
            {kpis.map((kpi, i) => (
              <View key={i} style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>
                {kpi.sub ? <Text style={styles.kpiSub}>{kpi.sub}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Module grid */}
        <Text style={styles.sectionTitle}>Módulos</Text>
        <View style={styles.moduleGrid}>
          {MODULES.map(mod => (
            <TouchableOpacity
              key={mod.id}
              style={styles.moduleCard}
              onPress={() => router.push(mod.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleIcon, { backgroundColor: mod.color + '18' }]}>
                <MaterialCommunityIcons name={mod.icon as any} size={28} color={mod.color} />
              </View>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              <Text style={styles.moduleSub}>{mod.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
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

  content: { padding: tokens.spacing.md },

  kpiLoading: { height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: tokens.spacing.lg },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm, marginBottom: tokens.spacing.lg },
  kpiCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.md,
    ...tokens.shadow.sm,
  },
  kpiLabel: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray600, fontWeight: '600', marginBottom: 4 },
  kpiValue: { fontSize: tokens.typography.size.lg, fontWeight: '800' },
  kpiSub: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 2 },

  sectionTitle: { fontSize: tokens.typography.size.lg, fontWeight: '800', color: tokens.colors.gray900, marginBottom: tokens.spacing.md },

  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md },
  moduleCard: {
    width: '47%',
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    alignItems: 'center',
    borderWidth: 1, borderColor: tokens.colors.gray100,
    ...tokens.shadow.sm,
  },
  moduleIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: tokens.spacing.sm },
  moduleTitle: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.gray900, textAlign: 'center' },
  moduleSub: { fontSize: 10, color: tokens.colors.gray400, textAlign: 'center', marginTop: 3, textTransform: 'uppercase' },
})
