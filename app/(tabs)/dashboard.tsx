import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, SafeAreaView
} from 'react-native'
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { InventoryService } from '@/services/inventory.service'
import { DashboardService, DashboardKPIs, WeeklyBar, TopProduct } from '@/services/dashboard.service'
import { InventoryRow } from '@/types/database.types'

const { width } = Dimensions.get('window')
const CHART_WIDTH = width - 64
const CHART_HEIGHT = 110

interface KpiCardProps {
  icon: string
  label: string
  value: string
  color: string
  bg: string
  onPress?: () => void
}

function KpiCard({ icon, label, value, color, bg, onPress }: KpiCardProps) {
  return (
    <TouchableOpacity
      style={[styles.kpiCard, { backgroundColor: bg }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

function WeekChart({ bars }: { bars: WeeklyBar[] }) {
  if (!bars.length) return null
  const max = Math.max(...bars.map(b => b.total), 1)
  const barW = Math.floor((CHART_WIDTH - 16) / bars.length) - 6
  const todayIdx = bars.length - 1

  return (
    <View style={styles.chartWrap}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 24}>
        {/* Baseline */}
        <Line
          x1={0} y1={CHART_HEIGHT} x2={CHART_WIDTH} y2={CHART_HEIGHT}
          stroke={tokens.colors.gray200} strokeWidth={1}
        />
        {bars.map((b, i) => {
          const bh = Math.max(4, Math.round((b.total / max) * CHART_HEIGHT))
          const x = i * (barW + 6) + 3
          const y = CHART_HEIGHT - bh
          const isToday = i === todayIdx
          return (
            <Svg key={b.day}>
              <Rect
                x={x} y={y} width={barW} height={bh}
                rx={4}
                fill={isToday ? tokens.colors.primary : tokens.colors.primary + '30'}
              />
              <SvgText
                x={x + barW / 2} y={CHART_HEIGHT + 16}
                fontSize={10} fill={isToday ? tokens.colors.primary : tokens.colors.gray400}
                fontWeight={isToday ? '700' : '400'}
                textAnchor="middle"
              >
                {b.label}
              </SvgText>
            </Svg>
          )
        })}
      </Svg>
    </View>
  )
}

export default function DashboardScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [weekBars, setWeekBars] = useState<WeeklyBar[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [lowStockItems, setLowStockItems] = useState<InventoryRow[]>([])

  const loadData = useCallback(async () => {
    try {
      const [kpisData, barsData, topData, invData] = await Promise.all([
        DashboardService.getKPIs(),
        DashboardService.getWeeklySales(),
        DashboardService.getTopProducts(5),
        InventoryService.getAll(),
      ])
      setKpis(kpisData)
      setWeekBars(barsData)
      setTopProducts(topData)
      setLowStockItems(invData.filter(i => i.quantity <= i.stock_min))
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const onRefresh = () => { setRefreshing(true); loadData() }

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    )
  }

  const trendPositive = (kpis?.salesTrend ?? 0) >= 0

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />
        }
      >
      {/* ── Hero Sales Card ── */}
      <View style={styles.heroCard}>
        <View style={styles.heroInfo}>
          <Text style={styles.heroLabel}>VENTAS DEL MES</Text>
          <Text style={styles.heroValue}>
            L. {(kpis?.monthSales ?? 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </Text>
          <View style={styles.trendRow}>
            <MaterialCommunityIcons
              name={trendPositive ? 'trending-up' : 'trending-down'}
              size={15}
              color="rgba(255,255,255,0.9)"
            />
            <Text style={styles.trendText}>
              {trendPositive ? '+' : ''}{kpis?.salesTrend ?? 0}% vs mes anterior
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chart-arc" size={110} color="rgba(255,255,255,0.08)" style={styles.heroBg} />
      </View>

      {/* ── KPI Grid ── */}
      <View style={styles.kpiGrid}>
        <KpiCard
          icon="clock-outline"
          label="Pedidos pendientes"
          value={String(kpis?.pendingOrders ?? 0)}
          color={tokens.colors.warning}
          bg={tokens.colors.warning + '15'}
          onPress={() => router.push('/(tabs)/sales' as any)}
        />
        <KpiCard
          icon="file-document-outline"
          label="Cotizaciones abiertas"
          value={String(kpis?.openQuotations ?? 0)}
          color={tokens.colors.info}
          bg={tokens.colors.info + '15'}
          onPress={() => router.push('/(tabs)/quotations' as any)}
        />
        <KpiCard
          icon="account-plus-outline"
          label="Clientes nuevos"
          value={String(kpis?.newCustomers ?? 0)}
          color={tokens.colors.success}
          bg={tokens.colors.success + '15'}
        />
        <KpiCard
          icon="alert-circle-outline"
          label="Stock bajo"
          value={String(kpis?.lowStockCount ?? lowStockItems.length)}
          color={tokens.colors.error}
          bg={tokens.colors.errorContainer}
        />
      </View>

      {/* ── Actividad Semanal ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividad Semanal</Text>
      </View>
      <View style={styles.card}>
        <WeekChart bars={weekBars} />
        {weekBars.length > 0 && (
          <Text style={styles.chartFooter}>
            Total semana: L. {weekBars.reduce((s, b) => s + b.total, 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </Text>
        )}
      </View>

      {/* ── Top Productos ── */}
      {topProducts.length > 0 && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Productos Vendidos</Text>
          </View>
          <View style={styles.card}>
            {topProducts.map((p, i) => (
              <View key={p.product_id} style={[styles.topRow, i < topProducts.length - 1 && styles.topRowBorder]}>
                <View style={[styles.topRank, i === 0 && styles.topRankGold]}>
                  <Text style={[styles.topRankText, i === 0 && styles.topRankTextGold]}>#{i + 1}</Text>
                </View>
                <View style={styles.topInfo}>
                  <Text style={styles.topName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.topSku}>{p.sku}</Text>
                </View>
                <Text style={styles.topQty}>{p.total_qty} uds</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ── Alertas de Inventario ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alertas de Inventario</Text>
        {lowStockItems.length > 0 && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{lowStockItems.length} CRÍTICOS</Text>
          </View>
        )}
      </View>

      {lowStockItems.length === 0 ? (
        <View style={[styles.card, styles.emptyStock]}>
          <MaterialCommunityIcons name="check-circle" size={40} color={tokens.colors.success} />
          <Text style={styles.emptyText}>Inventario saludable</Text>
        </View>
      ) : (
        <View style={styles.stockList}>
          {lowStockItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.stockCard}
              onPress={() => router.push(`/product/${item.products?.sku}` as any)}
              activeOpacity={0.8}
            >
              <View style={styles.stockCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName} numberOfLines={1}>{item.products?.name_es}</Text>
                  <Text style={styles.categoryName}>{item.products?.categories?.name_es ?? 'Sin categoría'}</Text>
                </View>
                <MaterialCommunityIcons name="alert-circle" size={18} color={tokens.colors.error} />
              </View>
              <View style={styles.stockFooter}>
                <View style={[styles.stockBadge, { backgroundColor: item.quantity === 0 ? tokens.colors.gray900 : tokens.colors.error }]}>
                  <Text style={styles.stockBadgeText}>
                    {item.quantity === 0 ? 'SIN STOCK' : `${item.quantity} / mín ${item.stock_min}`}
                  </Text>
                </View>
                <Text style={styles.priceText}>L. {item.products?.price_public?.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  backBtn: { padding: 4 },
  title: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: tokens.colors.gray900, flex: 1, marginLeft: 12 },
  scroll: { flex: 1 },
  content: { padding: tokens.spacing.md, paddingBottom: tokens.spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.colors.bgScreen },

  heroCard: {
    backgroundColor: tokens.colors.primaryContainer,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    minHeight: 150,
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: tokens.spacing.md,
    ...tokens.shadow.md,
  },
  heroInfo: { zIndex: 1 },
  heroLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.75)', letterSpacing: 1.2, marginBottom: 4 },
  heroValue: { fontSize: 34, fontWeight: '800', color: '#fff', marginBottom: 6 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  heroBg: { position: 'absolute', right: -10, bottom: -10 },

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  kpiCard: {
    width: (width - 48 - tokens.spacing.sm) / 2,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    gap: 4,
  },
  kpiValue: { fontSize: tokens.typography.size['2xl'], fontWeight: '800', marginTop: 4 },
  kpiLabel: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray600, fontWeight: '500' },

  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
    marginTop: tokens.spacing.xs,
  },
  sectionTitle: { fontSize: tokens.typography.size.lg, fontWeight: '700', color: tokens.colors.gray900 },
  alertBadge: { backgroundColor: tokens.colors.errorContainer, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  alertBadgeText: { fontSize: 10, fontWeight: '800', color: tokens.colors.error },

  card: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    ...tokens.shadow.sm,
  },

  chartWrap: { alignItems: 'center' },
  chartFooter: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, textAlign: 'right', marginTop: 4 },

  topRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: tokens.spacing.sm },
  topRowBorder: { borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100 },
  topRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: tokens.colors.gray100, alignItems: 'center', justifyContent: 'center' },
  topRankGold: { backgroundColor: '#FEF3C7' },
  topRankText: { fontSize: tokens.typography.size.xs, fontWeight: '700', color: tokens.colors.gray600 },
  topRankTextGold: { color: '#D97706' },
  topInfo: { flex: 1 },
  topName: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray900 },
  topSku: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400 },
  topQty: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.primary },

  stockList: { gap: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  stockCard: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    ...tokens.shadow.sm,
  },
  stockCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  productName: { fontSize: tokens.typography.size.base, fontWeight: '700', color: tokens.colors.gray900 },
  categoryName: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 1 },
  stockFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  stockBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  priceText: { fontSize: tokens.typography.size.lg, fontWeight: '800', color: tokens.colors.primary },
  emptyStock: { alignItems: 'center', paddingVertical: tokens.spacing.xl, gap: 8 },
  emptyText: { color: tokens.colors.gray600, fontWeight: '500' },
})
