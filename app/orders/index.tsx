import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, ScrollView
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OrderService } from '@/services/order.service'
import { Order } from '@/types/database.types'
import { tokens } from '@/theme/tokens'
import { EmptyState } from '@/components/common/EmptyState'

const STATUS_MAP: Record<Order['status'], { label: string, color: string, icon: string }> = {
  pending:   { label: 'Pendiente', color: '#f59e0b', icon: 'clock-outline' },
  confirmed: { label: 'Confirmado', color: '#10b981', icon: 'check-circle-outline' },
  shipped:   { label: 'Enviado',   color: '#3b82f6', icon: 'truck-delivery-outline' },
  delivered: { label: 'Entregado',  color: '#8b5cf6', icon: 'package-variant-closed' },
  cancelled: { label: 'Cancelado',  color: '#ef4444', icon: 'close-circle-outline' },
}

export default function OrdersListScreen() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [status, setStatus] = useState<Order['status'] | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      const data = await OrderService.getOrders(status === 'all' ? undefined : status)
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      Alert.alert('Error', 'No se pudieron cargar los pedidos.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [status])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const renderItem = ({ item }: { item: any }) => {
    const s = STATUS_MAP[item.status as Order['status']] || STATUS_MAP.pending
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/orders/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.order_number}</Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: s.color + '15' }]}>
            <MaterialCommunityIcons name={s.icon as any} size={14} color={s.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: s.color }]}>{s.label.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.customerInfo}>
            <MaterialCommunityIcons name="account-outline" size={16} color={tokens.colors.gray400} />
            <Text style={styles.customerName} numberOfLines={1}>
              {item.profiles?.full_name || 'Consumidor Final'}
            </Text>
          </View>
          <Text style={styles.total}>L. {item.total.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.itemCount}>
            {item.order_items?.length || 0} {item.order_items?.length === 1 ? 'producto' : 'productos'}
          </Text>
          <View style={styles.paymentBadge}>
            <Text style={[styles.paymentText, { color: item.payment_status === 'paid' ? tokens.colors.success : tokens.colors.warning }]}>
              {item.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE PAGO'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.title}>Pedidos (Web)</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => { setStatus(s); setLoading(true) }}
              style={[
                styles.filterTab,
                status === s && styles.filterTabActive
              ]}
            >
              <Text style={[
                styles.filterText,
                status === s && styles.filterTextActive
              ]}>
                {s === 'all' ? 'Todos' : STATUS_MAP[s as Order['status']].label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders() }} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="cart-outline"
              title="Sin pedidos"
              subtitle="No se encontraron pedidos con el estado seleccionado."
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
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: tokens.spacing.md, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800', color: tokens.colors.gray900, flex: 1, marginLeft: 12 },
  filterContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100 },
  filterScroll: { paddingHorizontal: tokens.spacing.md, paddingVertical: 10, gap: 8 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: tokens.colors.gray50, borderWidth: 1, borderColor: tokens.colors.gray100
  },
  filterTabActive: { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: tokens.colors.gray600 },
  filterTextActive: { color: '#fff' },
  list: { padding: tokens.spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    ...tokens.shadow.sm, borderWidth: 1, borderColor: tokens.colors.gray100
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderNumber: { fontSize: 16, fontWeight: '800', color: tokens.colors.gray900 },
  date: { fontSize: 12, color: tokens.colors.gray400, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '800' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  customerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 },
  customerName: { fontSize: 14, fontWeight: '600', color: tokens.colors.gray600, marginLeft: 6 },
  total: { fontSize: 16, fontWeight: '800', color: tokens.colors.primary },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: tokens.colors.gray50
  },
  itemCount: { fontSize: 11, color: tokens.colors.gray400, fontWeight: '500' },
  paymentBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: tokens.colors.gray50 },
  paymentText: { fontSize: 9, fontWeight: '800' },
})
