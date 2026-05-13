import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BalanceService, MonthlyCashflow } from '@/services/balance.service'
import { CashflowChart } from '@/components/finance/CashflowChart'
import { tokens } from '@/theme/tokens'

type Period = 'today' | 'week' | 'month' | 'quarter'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today',   label: 'Hoy' },
  { key: 'week',    label: 'Semana' },
  { key: 'month',   label: 'Mes' },
  { key: 'quarter', label: 'Trimestre' },
]

export default function CashflowScreen() {
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
      Alert.alert('Error', 'No se pudo cargar el flujo de caja.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData(period) }, [period, fetchData])

  const fmt = (n: number) =>
    `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const netPositive = (cashflow?.net ?? 0) >= 0

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flujo de Caja</Text>
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
          <>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { borderLeftColor: '#10b981' }]}>
                <Text style={styles.kpiLabel}>Ingresos</Text>
                <Text style={[styles.kpiValue, { color: '#10b981' }]}>{fmt(cashflow.income)}</Text>
              </View>
              <View style={[styles.kpiCard, { borderLeftColor: '#ef4444' }]}>
                <Text style={styles.kpiLabel}>Egresos</Text>
                <Text style={[styles.kpiValue, { color: '#ef4444' }]}>{fmt(cashflow.expenses)}</Text>
              </View>
            </View>

            <View style={[styles.netCard, { backgroundColor: netPositive ? '#10b98110' : '#ef444410' }]}>
              <Text style={styles.netLabel}>Resultado Neto</Text>
              <Text style={[styles.netValue, { color: netPositive ? '#10b981' : '#ef4444' }]}>
                {netPositive ? '+' : ''}{fmt(cashflow.net)}
              </Text>
              <View style={styles.netIndicator}>
                <MaterialCommunityIcons
                  name={netPositive ? 'trending-up' : 'trending-down'}
                  size={18}
                  color={netPositive ? '#10b981' : '#ef4444'}
                />
                <Text style={[styles.netIndicatorText, { color: netPositive ? '#10b981' : '#ef4444' }]}>
                  {netPositive ? 'Saldo positivo' : 'Saldo negativo'}
                </Text>
              </View>
            </View>

            {cashflow.weekly.length > 0 ? (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Actividad Semanal</Text>
                <CashflowChart data={cashflow.weekly} height={160} />

                <View style={styles.weekTable}>
                  {cashflow.weekly.map(w => (
                    <View key={w.week} style={styles.weekRow}>
                      <Text style={styles.weekLabel}>{w.week}</Text>
                      <Text style={styles.weekDateRange}>{w.label}</Text>
                      <Text style={[styles.weekIncome]}>+{fmt(w.income)}</Text>
                      <Text style={[styles.weekExpense]}>-{fmt(w.expenses)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.noData}>
                <MaterialCommunityIcons name="chart-line" size={48} color={tokens.colors.gray200} />
                <Text style={styles.noDataText}>Sin movimientos en este período</Text>
              </View>
            )}
          </>
        ) : null}

        <View style={{ height: 40 }} />
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
  tabActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  tabText: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray600 },
  tabTextActive: { color: '#fff' },
  content: { padding: tokens.spacing.md },
  kpiRow: { flexDirection: 'row', gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm },
  kpiCard: {
    flex: 1, backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl, padding: tokens.spacing.md,
    borderLeftWidth: 4,
    ...tokens.shadow.sm,
  },
  kpiLabel: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray600, fontWeight: '600' },
  kpiValue: { fontSize: tokens.typography.size.lg, fontWeight: '800', marginTop: 4 },
  netCard: {
    borderRadius: tokens.radius.xl, padding: tokens.spacing.lg,
    alignItems: 'center', marginBottom: tokens.spacing.md,
    borderWidth: 1, borderColor: 'transparent',
  },
  netLabel: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray600, fontWeight: '600' },
  netValue: { fontSize: 28, fontWeight: '800', marginVertical: 4 },
  netIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  netIndicatorText: { fontSize: tokens.typography.size.sm, fontWeight: '600' },
  chartCard: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl, padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    ...tokens.shadow.sm,
  },
  chartTitle: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.gray800, marginBottom: tokens.spacing.sm },
  weekTable: { marginTop: tokens.spacing.sm },
  weekRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: tokens.colors.gray100,
    gap: tokens.spacing.sm,
  },
  weekLabel: { width: 50, fontSize: tokens.typography.size.xs, fontWeight: '700', color: tokens.colors.gray800 },
  weekDateRange: { flex: 1, fontSize: 10, color: tokens.colors.gray400 },
  weekIncome: { fontSize: tokens.typography.size.xs, fontWeight: '700', color: '#10b981', width: 80, textAlign: 'right' },
  weekExpense: { fontSize: tokens.typography.size.xs, fontWeight: '700', color: '#ef4444', width: 80, textAlign: 'right' },
  noData: { alignItems: 'center', paddingVertical: 40 },
  noDataText: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray400, marginTop: 8 },
})
