import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ReportsService, FinanceReport } from '@/services/reports.service'
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_COLORS } from '@/services/expense.service'
import { CashflowChart } from '@/components/finance/CashflowChart'
import { PieChart } from '@/components/reports/PieChart'
import { SectionCard } from '@/components/common/SectionCard'
import { tokens } from '@/theme/tokens'

type Period = 'week' | 'month' | 'quarter' | 'year'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week',    label: 'Semana' },
  { key: 'month',   label: 'Mes' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'year',    label: 'Año' },
]

const fmtL = (n: number) => `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtShort = (n: number) => n >= 1000 || n <= -1000 ? `L.${(n / 1000).toFixed(1)}k` : fmtL(n)

export default function FinanceReportScreen() {
  const [period, setPeriod] = useState<Period>('month')
  const [report, setReport] = useState<FinanceReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (p: Period) => {
    try {
      const { from, to } = ReportsService.periodRange(p)
      const data = await ReportsService.getFinanceReport(from, to)
      setReport(data)
    } catch {
      Alert.alert('Error', 'No se pudo cargar el reporte financiero.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData(period) }, [period, fetchData])

  const netPositive = (report?.net ?? 0) >= 0

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
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

      {loading && !refreshing ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#10b981" /></View>
      ) : report ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(period) }} tintColor="#10b981" />
          }
        >
          {/* KPI row */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderTopColor: '#10b981' }]}>
              <MaterialCommunityIcons name="trending-up" size={18} color="#10b981" />
              <Text style={styles.kpiValue}>{fmtShort(report.income)}</Text>
              <Text style={styles.kpiLabel}>Ingresos</Text>
            </View>
            <View style={[styles.kpiCard, { borderTopColor: '#ef4444' }]}>
              <MaterialCommunityIcons name="trending-down" size={18} color="#ef4444" />
              <Text style={[styles.kpiValue, { color: '#ef4444' }]}>{fmtShort(report.expenses)}</Text>
              <Text style={styles.kpiLabel}>Gastos</Text>
            </View>
            <View style={[styles.kpiCard, { borderTopColor: netPositive ? '#3b82f6' : '#f59e0b' }]}>
              <MaterialCommunityIcons name="cash-multiple" size={18} color={netPositive ? '#3b82f6' : '#f59e0b'} />
              <Text style={[styles.kpiValue, { color: netPositive ? '#3b82f6' : '#f59e0b' }]}>{fmtShort(report.net)}</Text>
              <Text style={styles.kpiLabel}>Neto</Text>
            </View>
            <View style={[styles.kpiCard, { borderTopColor: '#8b5cf6' }]}>
              <MaterialCommunityIcons name="percent" size={18} color="#8b5cf6" />
              <Text style={[styles.kpiValue, { color: '#8b5cf6' }]}>{report.margin.toFixed(1)}%</Text>
              <Text style={styles.kpiLabel}>Margen</Text>
            </View>
          </View>

          {/* Net hero card */}
          <View style={[styles.netCard, { borderLeftColor: netPositive ? '#10b981' : '#ef4444' }]}>
            <Text style={styles.netLabel}>Balance Neto del Período</Text>
            <Text style={[styles.netValue, { color: netPositive ? '#10b981' : '#ef4444' }]}>
              {netPositive ? '+' : ''}{fmtL(report.net)}
            </Text>
            <View style={styles.marginRow}>
              <View style={styles.marginBar}>
                <View
                  style={[
                    styles.marginFill,
                    {
                      width: `${Math.min(100, Math.abs(report.margin))}%` as any,
                      backgroundColor: netPositive ? '#10b981' : '#ef4444',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.marginPct, { color: netPositive ? '#10b981' : '#ef4444' }]}>
                {report.margin.toFixed(1)}% margen
              </Text>
            </View>
          </View>

          {/* Monthly cashflow trend */}
          {report.monthly.length > 0 && (
            <SectionCard title="Tendencia Mensual">
              <CashflowChart
                data={report.monthly.map(m => ({ week: m.month, income: m.income, expenses: m.expenses }))}
                height={140}
              />
            </SectionCard>
          )}

          {/* Expense breakdown pie */}
          {report.expensesByCategory.length > 0 && (
            <SectionCard title="Gastos por Categoría">
              <PieChart
                data={report.expensesByCategory.map(e => ({
                  label: (EXPENSE_CATEGORY_LABELS as any)[e.category] ?? e.category,
                  value: e.total,
                  color: (EXPENSE_CATEGORY_COLORS as any)[e.category] ?? '#6b7280',
                }))}
                size={140}
              />
            </SectionCard>
          )}

          {/* Category detail list */}
          {report.expensesByCategory.length > 0 && (
            <SectionCard title="Detalle de Gastos">
              {report.expensesByCategory.map((e, i) => (
                <View key={e.category} style={[styles.catRow, i < report.expensesByCategory.length - 1 && styles.catRowBorder]}>
                  <View style={[styles.catDot, { backgroundColor: (EXPENSE_CATEGORY_COLORS as any)[e.category] ?? '#6b7280' }]} />
                  <Text style={styles.catName} numberOfLines={1}>
                    {(EXPENSE_CATEGORY_LABELS as any)[e.category] ?? e.category}
                  </Text>
                  <View style={styles.catRight}>
                    <Text style={styles.catAmount}>{fmtL(e.total)}</Text>
                    <Text style={styles.catPct}>{e.pct.toFixed(1)}%</Text>
                  </View>
                </View>
              ))}
            </SectionCard>
          )}

          {/* Monthly breakdown table */}
          {report.monthly.length > 1 && (
            <SectionCard title="Desglose Mensual">
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeadCell, { flex: 1.2 }]}>Mes</Text>
                <Text style={styles.tableHeadCell}>Ingresos</Text>
                <Text style={styles.tableHeadCell}>Gastos</Text>
                <Text style={styles.tableHeadCell}>Neto</Text>
              </View>
              {report.monthly.map((m, i) => {
                const mNet = m.income - m.expenses
                return (
                  <View key={m.month} style={[styles.tableRow, i < report.monthly.length - 1 && styles.tableRowBorder]}>
                    <Text style={[styles.tableCell, { flex: 1.2, fontWeight: '600', color: tokens.colors.gray900 }]} numberOfLines={1}>{m.month}</Text>
                    <Text style={[styles.tableCell, { color: '#10b981' }]}>{fmtShort(m.income)}</Text>
                    <Text style={[styles.tableCell, { color: '#ef4444' }]}>{fmtShort(m.expenses)}</Text>
                    <Text style={[styles.tableCell, { fontWeight: '800', color: mNet >= 0 ? '#10b981' : '#ef4444' }]}>{fmtShort(mNet)}</Text>
                  </View>
                )
              })}
            </SectionCard>
          )}

          {report.income === 0 && report.expenses === 0 && (
            <View style={styles.noData}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={56} color={tokens.colors.gray200} />
              <Text style={styles.noDataText}>Sin datos en este período</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: {
    paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm,
    gap: tokens.spacing.sm, backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100,
  },
  tab: {
    paddingHorizontal: tokens.spacing.md, paddingVertical: 7,
    borderRadius: tokens.radius.full, borderWidth: 1.5,
    borderColor: tokens.colors.gray200, backgroundColor: tokens.colors.bgLight,
  },
  tabActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  tabText: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray600 },
  tabTextActive: { color: '#fff' },
  content: { padding: tokens.spacing.md },

  kpiRow: { flexDirection: 'row', gap: tokens.spacing.xs, marginBottom: tokens.spacing.md },
  kpiCard: {
    flex: 1, backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl, padding: tokens.spacing.sm,
    alignItems: 'center', borderTopWidth: 3,
    ...tokens.shadow.sm,
  },
  kpiValue: { fontSize: 11, fontWeight: '800', color: tokens.colors.gray900, marginTop: 4, textAlign: 'center' },
  kpiLabel: { fontSize: 8, color: tokens.colors.gray600, textAlign: 'center', marginTop: 2, textTransform: 'uppercase' },

  netCard: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    borderLeftWidth: 4,
    ...tokens.shadow.sm,
  },
  netLabel: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray600, fontWeight: '600' },
  netValue: { fontSize: 26, fontWeight: '800', marginVertical: 6 },
  marginRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  marginBar: { flex: 1, height: 6, backgroundColor: tokens.colors.gray100, borderRadius: 3 },
  marginFill: { height: 6, borderRadius: 3 },
  marginPct: { fontSize: tokens.typography.size.xs, fontWeight: '700' },

  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: tokens.spacing.sm },
  catRowBorder: { borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100 },
  catDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  catName: { flex: 1, fontSize: tokens.typography.size.sm, color: tokens.colors.gray900 },
  catRight: { alignItems: 'flex-end' },
  catAmount: { fontSize: tokens.typography.size.sm, fontWeight: '800', color: tokens.colors.gray900 },
  catPct: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 1 },

  tableHeader: {
    flexDirection: 'row', paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100,
    marginBottom: 4,
  },
  tableHeadCell: { flex: 1, fontSize: 9, fontWeight: '700', color: tokens.colors.gray600, textTransform: 'uppercase', textAlign: 'right' },
  tableRow: { flexDirection: 'row', paddingVertical: 8 },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100 },
  tableCell: { flex: 1, fontSize: tokens.typography.size.xs, color: tokens.colors.gray800, textAlign: 'right' },

  noData: { alignItems: 'center', paddingVertical: 60 },
  noDataText: { fontSize: tokens.typography.size.base, color: tokens.colors.gray400, marginTop: 12 },
})
