import React, { useEffect, useState } from 'react'
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Image, Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { supabase } from '@/lib/supabase'
import { FiscalService } from '@/services/fiscal.service'
import { InventoryService } from '@/services/inventory.service'
import { InventoryRow } from '@/types/database.types'

const { width } = Dimensions.get('window')

export default function HomeScreen() {
  const router = useRouter()
  const [userName, setUserName] = useState('Operador')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fiscalAlerts, setFiscalAlerts] = useState<any[] | null>(null)
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
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(' ')[0])
      }

      // Load fiscal alerts
      const alerts = await FiscalService.getFiscalAlerts()
      setFiscalAlerts(alerts)

      // Load low stock items
      const inventory = await InventoryService.getAll()
      const lowStock = inventory.filter(item => item.quantity <= item.stock_min)
      setLowStockItems(lowStock.slice(0, 3)) // Show top 3

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
      {/* Top App Bar Replacement (Custom Header) */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>TECNI EXPRESS</Text>
          <Text style={styles.headerSubtitle}>Garantía de Servicio</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialCommunityIcons name="magnify" size={24} color={tokens.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={tokens.colors.onSurfaceVariant} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Fiscal Alerts Section */}
      {fiscalAlerts && fiscalAlerts.map((alert, idx) => (
        <TouchableOpacity 
          key={idx}
          style={[
            styles.alertCard, 
            { backgroundColor: alert.severity === 'error' ? tokens.colors.errorContainer : tokens.colors.warning + '15' }
          ]}
          onPress={() => router.push('/auxiliaries/fiscal' as any)}
        >
          <MaterialCommunityIcons 
            name={alert.severity === 'error' ? 'alert-octagon' : 'alert'} 
            size={24} 
            color={alert.severity === 'error' ? tokens.colors.error : tokens.colors.warning} 
          />
          <View style={styles.alertTextContainer}>
            <Text style={[styles.alertMessage, { color: alert.severity === 'error' ? tokens.colors.error : tokens.colors.onSurface }]}>
              {alert.message}
            </Text>
            <Text style={styles.alertSub}>Toca para gestionar CAI</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Hero Bento Header */}
      <View style={styles.heroGrid}>
        {/* Sales Summary Card */}
        <View style={styles.salesCard}>
          <View style={styles.salesInfo}>
            <Text style={styles.cardLabel}>RESUMEN DE VENTAS</Text>
            <Text style={styles.salesValue}>${stats.totalSales.toLocaleString()}</Text>
            <View style={styles.trendRow}>
              <MaterialCommunityIcons name="trending-up" size={16} color={tokens.colors.onPrimary} />
              <Text style={styles.trendText}>+{stats.salesTrend}% vs periodo anterior</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/sales')}>
              <MaterialCommunityIcons name="plus-circle" size={18} color={tokens.colors.primary} />
              <Text style={styles.primaryBtnText}>NUEVA VENTA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn}>
              <MaterialCommunityIcons name="file-document-outline" size={18} color={tokens.colors.onPrimary} />
              <Text style={styles.secondaryBtnText}>REPORTES</Text>
            </TouchableOpacity>
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
        <Text style={styles.sectionTitle}>Actividad de Ventas</Text>
        <View style={styles.daysFilter}>
          {['L', 'M', 'M', 'J', 'V'].map((day, i) => (
            <View key={i} style={[styles.dayChip, day === 'J' && styles.dayChipActive]}>
              <Text style={[styles.dayText, day === 'J' && styles.dayTextActive]}>{day}</Text>
            </View>
          ))}
        </View>
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

      {/* Quick Actions Buttons */}
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity 
          style={styles.quickActionBtn}
          onPress={() => router.push('/(tabs)/sales')}
        >
          <View style={styles.qaIconWrapper}>
            <MaterialCommunityIcons name="point-of-sale" size={24} color={tokens.colors.primary} />
          </View>
          <View>
            <Text style={styles.qaTitle}>POS RÁPIDO</Text>
            <Text style={styles.qaSubtitle}>Facturación Directa</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionBtn}
          onPress={() => router.push('/(tabs)/movements')}
        >
          <View style={[styles.qaIconWrapper, { backgroundColor: tokens.colors.secondaryContainer }]}>
            <MaterialCommunityIcons name="package-variant" size={24} color={tokens.colors.onSecondaryContainer} />
          </View>
          <View>
            <Text style={styles.qaTitle}>ENTRADA STOCK</Text>
            <Text style={styles.qaSubtitle}>Recepción</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Critical Stock Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Stock Crítico</Text>
        <View style={styles.alertBadge}>
          <Text style={styles.alertBadgeText}>{lowStockItems.length} ALERTAS</Text>
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
        <TouchableOpacity 
          style={styles.manageBtn}
          onPress={() => router.push('/(tabs)/inventory')}
        >
          <Text style={styles.manageBtnText}>GESTIONAR REPOSICIÓN DE STOCK</Text>
        </TouchableOpacity>
      </View>

      {/* Branding Footer */}
      <View style={styles.footer}>
        <Image 
          source={require('@/assets/site/logo_tecni_express.png')}
          style={styles.footerLogo}
          resizeMode="contain"
        />
        <Text style={styles.versionText}>v1.1.0 • Entorno de Producción</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
    marginTop: tokens.spacing.sm,
  },
  headerTitle: {
    fontSize: tokens.typography.size.xl,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.primary,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: tokens.typography.size.xs,
    color: tokens.colors.onSurfaceVariant,
    fontWeight: tokens.typography.weight.medium,
  },
  headerActions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  headerIcon: {
    padding: tokens.spacing.sm,
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.full,
    ...tokens.shadow.sm,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: tokens.colors.error,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    marginBottom: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...tokens.shadow.sm,
  },
  alertTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  alertMessage: {
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.bold,
  },
  alertSub: {
    fontSize: 11,
    color: tokens.colors.onSurfaceVariant,
    marginTop: 2,
  },
  heroGrid: {
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  salesCard: {
    backgroundColor: tokens.colors.primaryContainer,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    minHeight: 180,
    justifyContent: 'space-between',
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
  cardActions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    zIndex: 10,
    marginTop: tokens.spacing.md,
  },
  primaryBtn: {
    backgroundColor: tokens.colors.onPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: tokens.radius.md,
  },
  primaryBtnText: {
    color: tokens.colors.primary,
    fontSize: 12,
    fontWeight: tokens.typography.weight.bold,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: tokens.radius.md,
  },
  secondaryBtnText: {
    color: tokens.colors.onPrimary,
    fontSize: 12,
    fontWeight: tokens.typography.weight.bold,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.onSurface,
  },
  daysFilter: {
    flexDirection: 'row',
    gap: 6,
  },
  dayChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: tokens.colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: tokens.colors.primary,
  },
  dayText: {
    fontSize: 11,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.onSurfaceVariant,
  },
  dayTextActive: {
    color: tokens.colors.onPrimary,
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
  quickActionsGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: tokens.colors.bgLight,
    borderWidth: 1,
    borderColor: tokens.colors.outlineVariant,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...tokens.shadow.sm,
  },
  qaIconWrapper: {
    padding: 10,
    backgroundColor: tokens.colors.success + '15',
    borderRadius: tokens.radius.md,
  },
  qaTitle: {
    fontSize: 12,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.onSurface,
  },
  qaSubtitle: {
    fontSize: 11,
    color: tokens.colors.onSurfaceVariant,
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
  manageBtn: {
    marginTop: tokens.spacing.sm,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: tokens.colors.outlineVariant,
    alignItems: 'center',
  },
  manageBtnText: {
    fontSize: 11,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.onSurfaceVariant,
  },
  footer: {
    alignItems: 'center',
    marginTop: tokens.spacing.xl,
    paddingBottom: tokens.spacing.xl,
    opacity: 0.5,
  },
  footerLogo: {
    width: 120,
    height: 40,
    marginBottom: tokens.spacing.xs,
  },
  versionText: {
    fontSize: 10,
    color: tokens.colors.onSurfaceVariant,
  },
})

