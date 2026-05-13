import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ReportsService, CustomerReport } from '@/services/reports.service'
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

export default function CustomersReportScreen() {
  const [period, setPeriod] = useState<Period>('month')
  const [report, setReport] = useState<CustomerReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (p: Period) => {
    try {
      const { from, to } = ReportsService.periodRange(p)
      const data = await ReportsService.getCustomerReport(from, to)
      setReport(data)
    } catch {
      Alert.alert('Error', 'No se pudo cargar el reporte de clientes.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData(period) }, [period, fetchData])

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
        <View style={styles.centered}><ActivityIndicator size="large" color="#0ea5e9" /></View>
      ) : report ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(period) }} tintColor="#0ea5e9" />}
        >
          {/* KPI row */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderTopColor: '#0ea5e9' }]}>
              <MaterialCommunityIcons name="account-group-outline" size={20} color="#0ea5e9" />
              <Text style={styles.kpiValue}>{report.totalCustomers}</Text>
              <Text style={styles.kpiLabel}>Total Clientes</Text>
            </View>
            <View style={[styles.kpiCard, { borderTopColor: '#10b981' }]}>
              <MaterialCommunityIcons name="account-plus-outline" size={20} color="#10b981" />
              <Text style={styles.kpiValue}>{report.newThisMonth}</Text>
              <Text style={styles.kpiLabel}>Nuevos (mes)</Text>
            </View>
            <View style={[styles.kpiCard, { borderTopColor: '#f59e0b' }]}>
              <MaterialCommunityIcons name="account-reactivate-outline" size={20} color="#f59e0b" />
              <Text style={styles.kpiValue}>{report.returningCustomers}</Text>
              <Text style={styles.kpiLabel}>Recurrentes</Text>
            </View>
          </View>

          {/* Retention rate */}
          {report.topBuyers.length > 0 && (
            <View style={styles.retentionCard}>
              <Text style={styles.retentionLabel}>Tasa de Retención</Text>
              <Text style={styles.retentionValue}>
                {report.totalCustomers > 0
                  ? ((report.returningCustomers / report.totalCustomers) * 100).toFixed(1)
                  : '0'}%
              </Text>
              <View style={styles.retentionBar}>
                <View
                  style={[
                    styles.retentionFill,
                    {
                      width: `${report.totalCustomers > 0 ? Math.min(100, (report.returningCustomers / report.totalCustomers) * 100) : 0}%` as any,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Top buyers */}
          {report.topBuyers.length > 0 ? (
            <SectionCard title={`Top Compradores (${PERIODS.find(p => p.key === period)?.label})`}>
              {report.topBuyers.map((buyer, i) => (
                <View key={buyer.customer_id} style={[styles.buyerRow, i < report.topBuyers.length - 1 && styles.buyerRowBorder]}>
                  <View style={styles.buyerAvatar}>
                    <Text style={styles.buyerAvatarText}>{buyer.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.buyerInfo}>
                    <Text style={styles.buyerName} numberOfLines={1}>{buyer.name}</Text>
                    <Text style={styles.buyerOrders}>{buyer.orderCount} pedido{buyer.orderCount !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.buyerRight}>
                    <Text style={styles.buyerSpent}>{fmtL(buyer.totalSpent)}</Text>
                    {i < 3 && (
                      <MaterialCommunityIcons
                        name={i === 0 ? 'trophy' : i === 1 ? 'medal' : 'medal-outline'}
                        size={14}
                        color={i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : '#c2773a'}
                      />
                    )}
                  </View>
                </View>
              ))}
            </SectionCard>
          ) : (
            <View style={styles.noData}>
              <MaterialCommunityIcons name="account-group-outline" size={56} color={tokens.colors.gray200} />
              <Text style={styles.noDataText}>Sin compras en este período</Text>
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
  tabActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  tabText: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray600 },
  tabTextActive: { color: '#fff' },
  content: { padding: tokens.spacing.md },
  kpiRow: { flexDirection: 'row', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  kpiCard: {
    flex: 1, backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl, padding: tokens.spacing.sm,
    alignItems: 'center', borderTopWidth: 3,
    ...tokens.shadow.sm,
  },
  kpiValue: { fontSize: tokens.typography.size.base, fontWeight: '800', color: tokens.colors.gray900, marginTop: 4 },
  kpiLabel: { fontSize: 9, color: tokens.colors.gray600, textAlign: 'center', marginTop: 2, textTransform: 'uppercase' },

  retentionCard: {
    backgroundColor: tokens.colors.bgLight, borderRadius: tokens.radius.xl,
    padding: tokens.spacing.md, marginBottom: tokens.spacing.md, ...tokens.shadow.sm,
  },
  retentionLabel: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray600, fontWeight: '600' },
  retentionValue: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: '#0ea5e9', marginVertical: 6 },
  retentionBar: { height: 8, backgroundColor: tokens.colors.gray100, borderRadius: 4 },
  retentionFill: { height: 8, backgroundColor: '#0ea5e9', borderRadius: 4 },

  buyerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: tokens.spacing.sm },
  buyerRowBorder: { borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100 },
  buyerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0ea5e920', justifyContent: 'center', alignItems: 'center' },
  buyerAvatarText: { color: '#0ea5e9', fontWeight: '700', fontSize: 14 },
  buyerInfo: { flex: 1 },
  buyerName: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.gray900 },
  buyerOrders: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 2 },
  buyerRight: { alignItems: 'flex-end', gap: 3 },
  buyerSpent: { fontSize: tokens.typography.size.sm, fontWeight: '800', color: '#0ea5e9' },

  noData: { alignItems: 'center', paddingVertical: 60 },
  noDataText: { fontSize: tokens.typography.size.base, color: tokens.colors.gray400, marginTop: 12 },
})
