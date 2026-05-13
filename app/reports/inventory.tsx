import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ReportsService, InventoryReport } from '@/services/reports.service'
import { SectionCard } from '@/components/common/SectionCard'
import { tokens } from '@/theme/tokens'

const fmtL = (n: number) => `L. ${n.toLocaleString('es-HN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function InventoryReportScreen() {
  const [report, setReport] = useState<InventoryReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const data = await ReportsService.getInventoryReport()
      setReport(data)
    } catch {
      Alert.alert('Error', 'No se pudo cargar el reporte de inventario.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {loading && !refreshing ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#8b5cf6" /></View>
      ) : report ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData() }} tintColor="#8b5cf6" />}
        >
          {/* KPI row */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderTopColor: '#8b5cf6' }]}>
              <MaterialCommunityIcons name="package-variant-closed" size={20} color="#8b5cf6" />
              <Text style={styles.kpiValue}>{report.totalProducts}</Text>
              <Text style={styles.kpiLabel}>Productos</Text>
            </View>
            <View style={[styles.kpiCard, { borderTopColor: '#10b981' }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={20} color="#10b981" />
              <Text style={styles.kpiValue}>{report.activeProducts}</Text>
              <Text style={styles.kpiLabel}>Activos</Text>
            </View>
            <View style={[styles.kpiCard, { borderTopColor: '#3b82f6' }]}>
              <MaterialCommunityIcons name="warehouse" size={20} color="#3b82f6" />
              <Text style={styles.kpiValue}>{report.totalStock.toLocaleString()}</Text>
              <Text style={styles.kpiLabel}>Uds. Total</Text>
            </View>
            <View style={[styles.kpiCard, { borderTopColor: '#ef4444' }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#ef4444" />
              <Text style={[styles.kpiValue, { color: '#ef4444' }]}>{report.lowStockCount}</Text>
              <Text style={styles.kpiLabel}>Stock Bajo</Text>
            </View>
          </View>

          {/* Low stock list */}
          {report.lowStock.length > 0 && (
            <SectionCard title={`Stock Bajo (${report.lowStock.length})`}>
              {report.lowStock.map((item, i) => (
                <View key={item.product_id} style={[styles.row, i < report.lowStock.length - 1 && styles.rowBorder]}>
                  <View style={styles.rowDot}>
                    <View style={[styles.dot, { backgroundColor: item.qty === 0 ? '#ef4444' : '#f59e0b' }]} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.rowSku}>{item.sku}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[styles.rowQty, { color: item.qty === 0 ? '#ef4444' : '#f59e0b' }]}>
                      {item.qty} ud.
                    </Text>
                    <Text style={styles.rowMin}>mín {item.stock_min}</Text>
                  </View>
                </View>
              ))}
            </SectionCard>
          )}

          {/* Top value */}
          {report.topValue.length > 0 && (
            <SectionCard title="Top Valor en Bodega">
              {report.topValue.map((item, i) => (
                <View key={item.product_id} style={[styles.row, i < report.topValue.length - 1 && styles.rowBorder]}>
                  <Text style={[styles.rank, i < 3 && { color: '#f59e0b' }]}>#{i + 1}</Text>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.rowSku}>{item.sku}  •  {item.qty} uds. × {fmtL(item.unit_price)}</Text>
                  </View>
                  <Text style={styles.rowValue}>{fmtL(item.total_value)}</Text>
                </View>
              ))}
            </SectionCard>
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
  content: { padding: tokens.spacing.md },
  kpiRow: { flexDirection: 'row', gap: tokens.spacing.xs, marginBottom: tokens.spacing.md },
  kpiCard: {
    flex: 1, backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl, padding: tokens.spacing.sm,
    alignItems: 'center', borderTopWidth: 3,
    ...tokens.shadow.sm,
  },
  kpiValue: { fontSize: tokens.typography.size.base, fontWeight: '800', color: tokens.colors.gray900, marginTop: 4 },
  kpiLabel: { fontSize: 9, color: tokens.colors.gray600, textAlign: 'center', marginTop: 2, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: tokens.spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100 },
  rowDot: { width: 20, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray900 },
  rowSku: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  rowQty: { fontSize: tokens.typography.size.sm, fontWeight: '800' },
  rowMin: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400 },
  rank: { width: 28, fontSize: tokens.typography.size.sm, fontWeight: '800', color: tokens.colors.gray400, textAlign: 'center' },
  rowValue: { fontSize: tokens.typography.size.sm, fontWeight: '800', color: '#8b5cf6' },
})
