import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Alert, Linking, ScrollView,
} from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OrderDetailService } from '@/services/order-detail.service'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { tokens } from '@/theme/tokens'
import { Order } from '@/types/database.types'

const TABS: { key: string; label: string }[] = [
  { key: 'all',       label: 'Todos' },
  { key: 'pending',   label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmados' },
  { key: 'shipped',   label: 'Enviados' },
  { key: 'delivered', label: 'Entregados' },
  { key: 'cancelled', label: 'Cancelados' },
]

const STATUS_MAP = {
  pending:   { label: 'Pendiente',  color: '#D97706', bg: '#FEF3C7' },
  confirmed: { label: 'Confirmado', color: '#2563EB', bg: '#DBEAFE' },
  shipped:   { label: 'Enviado',    color: '#7C3AED', bg: '#EDE9FE' },
  delivered: { label: 'Entregado',  color: '#059669', bg: '#D1FAE5' },
  cancelled: { label: 'Cancelado',  color: '#DC2626', bg: '#FEE2E2' },
}

export default function SalesScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrders = useCallback(async (status: string) => {
    try {
      setLoading(true)
      const data = await OrderDetailService.getAll(status)
      setOrders(data)
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los pedidos.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchOrders(activeTab) }, [activeTab, fetchOrders])

  const handleTabChange = (key: string) => {
    setActiveTab(key)
  }

  const openWhatsApp = (phone: string) => {
    const clean = phone.replace(/\D/g, '')
    Linking.openURL(`https://wa.me/504${clean}`)
  }

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/orders/${item.id}` as any)}
      activeOpacity={0.8}
    >
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderNo}>#{item.order_number}</Text>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        <StatusBadge status={item.status} map={STATUS_MAP} />
      </View>

      {/* Customer */}
      <View style={styles.customerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.profiles?.full_name?.charAt(0) ?? 'C'}</Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.profiles?.full_name ?? 'Cliente Final'}</Text>
          <Text style={styles.customerPhone}>{item.profiles?.phone ?? ''}</Text>
        </View>
        {item.profiles?.phone && (
          <TouchableOpacity
            style={styles.waBtn}
            onPress={(e) => { e.stopPropagation?.(); openWhatsApp(item.profiles.phone) }}
          >
            <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
          </TouchableOpacity>
        )}
      </View>

      {/* Items preview */}
      {(item.order_items?.length ?? 0) > 0 && (
        <View style={styles.itemsPreview}>
          {item.order_items.slice(0, 2).map((oi: any, i: number) => (
            <Text key={i} style={styles.itemLine} numberOfLines={1}>
              • {oi.product_name_es} × {oi.quantity}
            </Text>
          ))}
          {item.order_items.length > 2 && (
            <Text style={styles.itemMore}>+{item.order_items.length - 2} más</Text>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.totalValue}>L. {item.total?.toFixed(2)}</Text>
        {item.status === 'pending' && item.payment_status !== 'paid' && (
          <TouchableOpacity
            style={styles.invoiceBtn}
            onPress={(e) => { e.stopPropagation?.(); router.push(`/invoices/new?fromOrderId=${item.id}` as any) }}
          >
            <MaterialCommunityIcons name="receipt-outline" size={14} color="#fff" />
            <Text style={styles.invoiceBtnText}>Facturar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Gestión de Ventas</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.push('/invoices/new' as any)}
          >
            <MaterialCommunityIcons name="receipt-text-outline" size={17} color={tokens.colors.primary} />
            <Text style={styles.outlineBtnText}>Factura</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.solidBtn}
            onPress={() => router.push('/sales/new' as any)}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.solidBtnText}>Nueva</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabs}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => handleTabChange(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <FlashList
          data={orders}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(activeTab) }} tintColor={tokens.colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="shopping-outline"
              title="Sin pedidos"
              subtitle={activeTab === 'all' ? 'Aún no hay pedidos registrados.' : `No hay pedidos en estado "${TABS.find(t => t.key === activeTab)?.label}".`}
              action={{ label: 'Nueva venta', onPress: () => router.push('/sales/new' as any) }}
            />
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 14,
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  screenTitle: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: tokens.colors.gray900 },
  headerActions: { flexDirection: 'row', gap: tokens.spacing.sm },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: tokens.radius.lg,
    borderWidth: 1.5, borderColor: tokens.colors.primary + '50',
    backgroundColor: tokens.colors.primary + '08',
  },
  outlineBtnText: { fontSize: 13, fontWeight: '700', color: tokens.colors.primary },
  solidBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.primary,
    ...tokens.shadow.sm,
  },
  solidBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  tabsContainer: { flexGrow: 0, maxHeight: 50 },
  tabs: { paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.xs, gap: tokens.spacing.xs, alignItems: 'center' },
  tab: {
    paddingHorizontal: tokens.spacing.md, paddingVertical: 6,
    borderRadius: tokens.radius.full,
    borderWidth: 1.5, borderColor: tokens.colors.gray200,
    backgroundColor: tokens.colors.bgLight,
  },
  tabActive: { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary },
  tabText: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray600 },
  tabTextActive: { color: '#fff' },

  list: { padding: tokens.spacing.md, paddingBottom: 40 },

  card: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    ...tokens.shadow.md,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: tokens.spacing.md,
  },
  orderNo: { fontSize: tokens.typography.size.lg, fontWeight: '800', color: tokens.colors.gray900 },
  date: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 2 },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: tokens.colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: tokens.colors.primary, fontWeight: '700', fontSize: 15 },
  customerInfo: { flex: 1 },
  customerName: { fontSize: tokens.typography.size.base, fontWeight: '700', color: tokens.colors.gray900 },
  customerPhone: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400 },
  waBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E9FBF0', justifyContent: 'center', alignItems: 'center' },

  itemsPreview: { marginBottom: tokens.spacing.sm, paddingBottom: tokens.spacing.sm, borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100 },
  itemLine: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray600, marginBottom: 2 },
  itemMore: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, fontStyle: 'italic' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalValue: { fontSize: tokens.typography.size.lg, fontWeight: '800', color: tokens.colors.primary },
  invoiceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: tokens.radius.lg,
    ...tokens.shadow.sm,
  },
  invoiceBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
})
