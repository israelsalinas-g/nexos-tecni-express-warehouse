import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BalanceService, MonthlyCashflow } from '@/services/balance.service'
import { tokens } from '@/theme/tokens'

type Period = 'today' | 'week' | 'month' | 'quarter'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today',   label: 'Hoy' },
  { key: 'week',    label: 'Semana' },
  { key: 'month',   label: 'Mes' },
  { key: 'quarter', label: 'Trimestre' },
]

function BalanceRow({ label, value, bold = false, indent = false, color }: {
  label: string
  value: number
  bold?: boolean
  indent?: boolean
  color?: string
}) {
  return (
    <View style={[styles.balanceRow, indent && styles.balanceRowIndent]}>
      <Text style={[styles.rowLabel, bold && styles.rowLabelBold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold, color ? { color } : null]}>
        L. {value.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
    </View>
  )
}

export default function BalanceScreen() {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('month')
  const [cashflow, setCashflow] = useState<MonthlyCashflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (p: Period) => {
    try {
      const { from, to } = BalanceService.periodRange(p)
      const data = await BalanceService.getCashflow(from, to)
      setCashflow(data)
    } catch {
      Alert.alert('Error', 'No se pudo cargar el balance.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData(period) }, [period, fetchData])

  const grossProfit = (cashflow?.income ?? 0) - (cashflow?.expenses ?? 0)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Balance del Período</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabs}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[styles.tab, period === p.key && styles.tabActive]}
            onPress={() => { setPeriod(p.key); setLoading(true) }}
          >
            <Text style={[styles.tabText, period === p.key && styles.tabTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(period) }} tintColor={tokens.colors.primary} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={tokens.colors.primary} /></View>
        ) : cashflow ? (
          <View style={styles.reportCard}>
            <Text style={styles.sectionTitle}>INGRESOS DEL PERÍODO</Text>
            <BalanceRow label="Ventas cobradas" value={cashflow.income} indent />
            <View style={styles.separator} />
            <BalanceRow label="Total ingresos" value={cashflow.income} bold />

            <View style={{ height: 32 }} />

            <Text style={styles.sectionTitle}>EGRESOS DEL PERÍODO</Text>
            <BalanceRow label="Gastos operativos" value={cashflow.expenses} indent />
            <View style={styles.separator} />
            <BalanceRow label="Total egresos" value={cashflow.expenses} bold />

            <View style={{ height: 40 }} />

            <View style={[styles.resultBox, { borderTopColor: grossProfit >= 0 ? '#10b981' : '#ef4444' }]}>
              <Text style={styles.resultLabel}>Utilidad bruta</Text>
              <Text style={[styles.resultValue, { color: grossProfit >= 0 ? '#10b981' : '#ef4444' }]}>
                {grossProfit < 0 ? '-' : ''} L. {Math.abs(grossProfit).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>

            {grossProfit < 0 && (
              <Text style={styles.negativeAlert}>Los egresos superaron los ingresos en este período</Text>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', height: 200 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: tokens.spacing.md, paddingVertical: 12,
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100,
    gap: tokens.spacing.sm,
  },
  headerBack: { padding: 4 },
  headerTitle: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: tokens.colors.gray900 },
  tabsContainer: { flexGrow: 0, maxHeight: 50 },
  tabs: { paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.xs, gap: tokens.spacing.xs, alignItems: 'center' },
  tab: {
    paddingHorizontal: tokens.spacing.md, paddingVertical: 6,
    borderRadius: tokens.radius.full,
    borderWidth: 1.5, borderColor: tokens.colors.gray200,
    backgroundColor: tokens.colors.bgLight,
  },
  tabActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  tabText: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray600 },
  tabTextActive: { color: '#fff' },
  content: { padding: tokens.spacing.md },
  reportCard: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl, padding: tokens.spacing.lg,
    ...tokens.shadow.md,
  },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: tokens.colors.gray400, letterSpacing: 1.2, marginBottom: 8 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  balanceRowIndent: { paddingLeft: 16 },
  rowLabel: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray600 },
  rowLabelBold: { fontWeight: '700', color: tokens.colors.gray900 },
  rowValue: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray900, fontFamily: 'monospace' },
  rowValueBold: { fontWeight: '800' },
  separator: { height: 1, backgroundColor: tokens.colors.gray100, marginVertical: 4 },
  resultBox: { borderTopWidth: 2, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { fontSize: tokens.typography.size.base, fontWeight: '800', color: tokens.colors.gray900 },
  resultValue: { fontSize: tokens.typography.size.lg, fontWeight: '900' },
  negativeAlert: { fontSize: 11, color: '#ef4444', textAlign: 'center', marginTop: 12, fontWeight: '500' },
})
