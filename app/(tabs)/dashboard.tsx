import React, { useEffect, useState } from 'react'
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { InventoryService } from '@/services/inventory.service'
import { InventoryRow } from '@/types/database.types'

const { width } = Dimensions.get('window')

export default function DashboardScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lowStockItems, setLowStockItems] = useState<InventoryRow[]>([])
  const [stats, setStats] = useState({
    totalSales: 12450.00,
    salesTrend: 14,
    technicalTickets: 24,
    technicalInProcess: 8,
    technicalCompleted: 12
  })

  const loadData = async () => {
    try {
      // Load low stock items
      const inventory = await InventoryService.getAll()
      const lowStock = inventory.filter(item => item.quantity <= item.stock_min)
      setLowStockItems(lowStock)

    } catch (error) {
      console.error('Dashboard data error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />
      }
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Métricas de Rendimiento</Text>
      </View>

      {/* Hero Bento Header */}
      <View style={styles.heroGrid}>
        {/* Sales Summary Card */}
        <View style={styles.salesCard}>
          <View style={styles.salesInfo}>
            <Text style={styles.cardLabel}>VENTAS DEL MES</Text>
            <Text style={styles.salesValue}>${stats.totalSales.toLocaleString()}</Text>
            <View style={styles.trendRow}>
              <MaterialCommunityIcons name="trending-up" size={16} color={tokens.colors.onPrimary} />
              <Text style={styles.trendText}>+{stats.salesTrend}% vs periodo anterior</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chart-arc" size={120} color={tokens.colors.onPrimary} style={styles.cardBgIcon} />
        </View>

        {/* Technical Service Card */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <View style={styles.serviceIconWrapper}>
              <MaterialCommunityIcons name="hammer-wrench" size={20} color={tokens.colors.tertiary} />
            </View>
            <Text style={styles.cardLabelDark}>SERVICIO TÉCNICO</Text>
          </View>
          <Text style={styles.serviceCount}>{stats.technicalTickets} Tickets</Text>
          <View style={styles.serviceStats}>
            <View style={styles.statLine}>
              <View style={[styles.statDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.statText}>{stats.technicalInProcess} En Proceso</Text>
            </View>
            <View style={styles.statLine}>
              <View style={[styles.statDot, { backgroundColor: tokens.colors.primary }]} />
              <Text style={styles.statText}>{stats.technicalCompleted} Completados</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
        </View>
      </View>

      {/* Activity Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Actividad Semanal</Text>
      </View>

      <View style={styles.chartMockup}>
        <View style={styles.chartBars}>
          <View style={[styles.bar, { height: '45%' }]} />
          <View style={[styles.bar, { height: '65%' }]} />
          <View style={[styles.bar, { height: '55%' }]} />
          <View style={[styles.bar, { height: '90%', backgroundColor: tokens.colors.primary }]}>
             <Text style={styles.barLabel}>Hoy</Text>
          </View>
          <View style={[styles.bar, { height: '30%', backgroundColor: tokens.colors.gray200 }]} />
        </View>
        <View style={styles.chartLabels}>
          <Text style={styles.chartLabelText}>Lun</Text>
          <Text style={styles.chartLabelText}>Mar</Text>
          <Text style={styles.chartLabelText}>Mie</Text>
          <Text style={[styles.chartLabelText, { color: tokens.colors.primary, fontWeight: '700' }]}>Hoy</Text>
          <Text style={styles.chartLabelText}>Vie</Text>
        </View>
      </View>

      {/* Critical Stock Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Alertas de Inventario</Text>
        <View style={styles.alertBadge}>
          <Text style={styles.alertBadgeText}>{lowStockItems.length} CRÍTICOS</Text>
        </View>
      </View>

      <View style={styles.criticalStockList}>
        {lowStockItems.length > 0 ? lowStockItems.map((item) => (
          <View key={item.id} style={styles.stockCard}>
            <View style={styles.stockCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{item.products?.name_es}</Text>
                <Text style={styles.categoryName}>{item.products?.categories?.name_es || 'Sin categoría'}</Text>
              </View>
              <MaterialCommunityIcons name="alert-circle" size={20} color={tokens.colors.error} />
            </View>
            <View style={styles.stockDetails}>
              <Text style={styles.techData}>ID: {item.products?.sku}</Text>
              <Text style={styles.techData}>Mín: {item.stock_min}</Text>
            </View>
            <View style={styles.stockFooter}>
              <View style={[styles.stockBadge, { backgroundColor: item.quantity === 0 ? tokens.colors.gray900 : tokens.colors.error }]}>
                <Text style={styles.stockBadgeText}>
                  {item.quantity === 0 ? 'SIN STOCK' : `${item.quantity} UNIDADES`}
                </Text>
              </View>
              <Text style={styles.priceText}>${item.products?.base_price?.toFixed(2)}</Text>
            </View>
          </View>
        )) : (
          <View style={styles.emptyStock}>
            <MaterialCommunityIcons name="check-circle" size={48} color={tokens.colors.success} />
            <Text style={styles.emptyText}>Inventario saludable</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.bgScreen,
  },
  content: {
    padding: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.bgScreen,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
  },
  sectionTitle: {
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.onSurface,
  },
  heroGrid: {
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  salesCard: {
    backgroundColor: tokens.colors.primaryContainer,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    minHeight: 160,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...tokens.shadow.md,
  },
  salesInfo: {
    zIndex: 10,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.onPrimary,
    opacity: 0.8,
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardLabelDark: {
    fontSize: 10,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.onSurfaceVariant,
    opacity: 0.6,
    letterSpacing: 1,
  },
  salesValue: {
    fontSize: 36,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.onPrimary,
    marginBottom: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    color: tokens.colors.onPrimary,
    fontWeight: tokens.typography.weight.medium,
  },
  cardBgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.1,
  },
  serviceCard: {
    backgroundColor: tokens.colors.bgLight,
    borderWidth: 1,
    borderColor: tokens.colors.outlineVariant,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    ...tokens.shadow.sm,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceIconWrapper: {
    padding: 6,
    backgroundColor: tokens.colors.tertiaryContainer + '20',
    borderRadius: 6,
  },
  serviceCount: {
    fontSize: tokens.typography.size.xl,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.onSurface,
    marginBottom: 12,
  },
  serviceStats: {
    gap: 6,
    marginBottom: 16,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statText: {
    fontSize: 13,
    color: tokens.colors.onSurfaceVariant,
  },
  progressBar: {
    height: 8,
    backgroundColor: tokens.colors.gray100,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.primary,
    borderRadius: 4,
  },
  chartMockup: {
    backgroundColor: tokens.colors.bgLight,
    borderWidth: 1,
    borderColor: tokens.colors.outlineVariant,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
    ...tokens.shadow.sm,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    gap: 12,
  },
  bar: {
    flex: 1,
    backgroundColor: tokens.colors.primary + '40',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    position: 'relative',
    alignItems: 'center',
  },
  barLabel: {
    position: 'absolute',
    top: -24,
    fontSize: 10,
    fontWeight: 'bold',
    color: tokens.colors.primary,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  chartLabelText: {
    fontSize: 11,
    color: tokens.colors.outline,
    flex: 1,
    textAlign: 'center',
  },
  alertBadge: {
    backgroundColor: tokens.colors.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.error,
  },
  criticalStockList: {
    gap: tokens.spacing.sm,
  },
  stockCard: {
    backgroundColor: tokens.colors.bgLight,
    borderWidth: 1,
    borderColor: tokens.colors.outlineVariant,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    ...tokens.shadow.sm,
  },
  stockCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.onSurface,
  },
  categoryName: {
    fontSize: 11,
    color: tokens.colors.onSurfaceVariant,
  },
  stockDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  techData: {
    fontSize: 11,
    color: tokens.colors.onSurfaceVariant,
    fontWeight: tokens.typography.weight.medium,
  },
  stockFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: tokens.typography.weight.bold,
    color: '#fff',
  },
  priceText: {
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.primary,
  },
  emptyStock: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.outlineVariant,
    borderStyle: 'dashed',
  },
  emptyText: {
    marginTop: 8,
    color: tokens.colors.onSurfaceVariant,
    fontWeight: tokens.typography.weight.medium,
  },
})
