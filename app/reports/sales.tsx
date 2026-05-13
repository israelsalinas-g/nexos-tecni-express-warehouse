import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ReportsService, SalesReport } from '@/services/reports.service'
import { BarChart } from '@/components/reports/BarChart'
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

const PM_LABELS: Record<string, string> = {
  cash:            'Efectivo',
  card:            'Tarjeta',
  transfer:        'Transferencia',
  credit:          'Crédito',
  no_especificado: 'Sin especificar',
}

const PM_COLORS: Record<string, string> = {
  cash: '#10b981', card: '#3b82f6', transfer: '#f59e0b', credit: '#8b5cf6', no_especificado: '#9ca3af',
}

const fmtL = (n: number) => `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function SalesReportScreen() {
  const [period, setPeriod] = useState<Period>('month')
  const [report, setReport] = useState<SalesReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (p: Period) => {
    try {
      const { from, to } = ReportsService.periodRange(p)
      const data = await ReportsService.getSalesReport(from, to)
      setReport(data)
    } catch {
      Alert.alert('Error', 'No se pudo cargar el reporte de ventas.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData(period) }, [period, fetchData])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Period tabs */}
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
        <View style={styles.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>
      ) : report ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(period) }} tintColor="#3b82f6" />
          }
        >
          {/* KPI row */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderTopColor: '#3b82f6' }]}>
              <Text style={styles.kpiLabel}>Ingresos</Text>
              <Text style={[styles.kpiValue, { color: '#3b82f6' }]}>{fmtL(report.totalRevenue)}</Text>
            </View>
            <View style={[styles.kpiCard, { borderTopColor: '#10b981' }]}>
              <Text style={styles.kpiLabel}>Pedidos</Text>
              <Text style={[styles.kpiValue, { color: '#10b981' }]}>{report.orderCount}</Text>
            </View>
            <View style={[styles.kpiCard, { borderTopColor: '#f59e0b' }]}>
              <Text style={styles.kpiLabel}>Ticket Promedio</Text>
              <Text style={[styles.kpiValue, { color: '#f59e0b' }]}>
                L.{(report.avgOrderValue / 1000).toFixed(1)}k
              </Text>
            </View>
          </View>

          {/* Revenue bars */}
          {report.byPeriod.length > 0 && (
            <SectionCard title="Ingresos por Semana">
              <BarChart
                data={report.byPeriod.map(p => ({ label: p.label, value: p.total }))}
                barColor="#3b82f6"
                height={160}
              />
            </SectionCard>
          )}

          {/* Payment method pie */}
          {report.byPaymentMethod.length > 0 && (
            <SectionCard title="Métodos de Pago">
              <PieChart
                data={report.byPaymentMethod.map(pm => ({
                  label: PM_LABELS[pm.method] ?? pm.method,
                  value: pm.total,
                  color: PM_COLORS[pm.method] ?? '#6b7280',
                }))}
                size={140}
              />
            </SectionCard>
          )}

          {/* Top products */}
          {report.topProducts.length > 0 && (
            <SectionCard title="Top Productos por Ingreso">
              {report.topProducts.map((p, i) => (
                <View key={p.product_id} style={[styles.rankRow, i < report.topProducts.length - 1 && styles.rankRowBorder]}>
                  <Text style={[styles.rank, i < 3 && { color: '#f59e0b' }]}>#{i + 1}</Text>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.rankSku}>{p.sku}  •  {p.total_qty} uds.</Text>
                  </View>
                  <Text style={styles.rankRevenue}>{fmtL(p.total_revenue)}</Text>
                </View>
              ))}
            </SectionCard>
          )}

          {report.totalRevenue === 0 && (
            <View style={styles.noData}>
              <MaterialCommunityIcons name="chart-bar" size={56} color={tokens.colors.gray200} />
              <Text style={styles.noDataText}>Sin ventas en este período</Text>
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
  tabs: { paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm, gap: tokens.spacing.sm, backgroundColor: tokens.colors.bgLight, borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100 },
  tab: { paddingHorizontal: tokens.spacing.md, paddingVertical: 7, borderRadius: tokens.radius.full, borderWidth: 1.5, borderColor: tokens.colors.gray200, backgroundColor: tokens.colors.bgLight },
  tabActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  tabText: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray600 },
  tabTextActive: { color: '#fff' },
  content: { padding: tokens.spacing.md },
  kpiRow: { flexDirection: 'row', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  kpiCard: {
    flex: 1, backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl, padding: tokens.spacing.sm,
    borderTopWidth: 3, alignItems: 'center',
    ...tokens.shadow.sm,
  },
  kpiLabel: { fontSize: 9, color: tokens.colors.gray600, fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' },
  kpiValue: { fontSize: tokens.typography.size.base, fontWeight: '800', marginTop: 3, textAlign: 'center' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: 10 },
  rankRowBorder: { borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100 },
  rank: { width: 28, fontSize: tokens.typography.size.sm, fontWeight: '800', color: tokens.colors.gray400, textAlign: 'center' },
  rankInfo: { flex: 1 },
  rankName: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray900 },
  rankSku: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 2 },
  rankRevenue: { fontSize: tokens.typography.size.sm, fontWeight: '800', color: '#3b82f6' },
  noData: { alignItems: 'center', paddingVertical: 60 },
  noDataText: { fontSize: tokens.typography.size.base, color: tokens.colors.gray400, marginTop: 12 },
})
