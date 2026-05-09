import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { tokens } from '@/theme/tokens'

interface OrderItem {
  productName: string
  sku:         string
  quantity:    number
}

interface Order {
  id:        string
  orderNo:   string
  customer:  string
  createdAt: string
  items:     OrderItem[]
}

export default function OrdersScreen() {
  const [orders, setOrders]       = useState<Order[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [warehouseId, setWarehouseId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: wh } = await supabase
        .from('warehouses')
        .select('id')
        .eq('is_default', true)
        .single()

      setWarehouseId(wh?.id ?? null)
    }
    init()
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('orders')
        .select(`
          id, order_number, status, created_at,
          profiles(full_name),
          order_items(product_name_es, sku, quantity)
        `)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: true })

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId)
      }

      const { data } = await query

      const mapped: Order[] = (data ?? []).map((o: any) => ({
        id:        o.id,
        orderNo:   o.order_number,
        customer:  o.profiles?.full_name ?? 'Cliente',
        createdAt: new Date(o.created_at).toLocaleDateString('es-HN'),
        items:     (o.order_items ?? []).map((i: any) => ({
          productName: i.product_name_es,
          sku:         i.sku,
          quantity:    i.quantity,
        })),
      }))

      setOrders(mapped)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [warehouseId])

  useEffect(() => { if (warehouseId !== null) fetchOrders() }, [fetchOrders, warehouseId])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }

  const markDispatched = async (orderId: string) => {
    Alert.alert('Confirmar despacho', '¿Marcar esta orden como despachada?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          const { error } = await supabase
            .from('orders')
            .update({ status: 'shipped' })
            .eq('id', orderId)
          if (error) { Alert.alert('Error', error.message); return }
          setOrders((prev) => prev.filter((o) => o.id !== orderId))
        },
      },
    ])
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    )
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={tokens.colors.primary} 
        />
      }
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={48} color={tokens.colors.gray200} />
          <Text style={styles.emptyText}>No hay órdenes pendientes de despacho.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.orderNo}>Orden #{item.orderNo}</Text>
              <Text style={styles.date}>{item.createdAt}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Pendiente</Text>
            </View>
          </View>
          
          <View style={styles.customerBox}>
            <MaterialCommunityIcons name="account-outline" size={16} color={tokens.colors.gray400} />
            <Text style={styles.customer}>{item.customer}</Text>
          </View>

          <View style={styles.items}>
            {item.items.map((i, idx) => (
              <View key={idx} style={styles.item}>
                <Text style={styles.itemName} numberOfLines={1}>{i.productName}</Text>
                <Text style={styles.itemQty}>× {i.quantity}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.dispatchBtn} 
            onPress={() => markDispatched(item.id)}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Despachar orden ${item.orderNo}`}
          >
            <MaterialCommunityIcons name="truck-delivery-outline" size={20} color="#fff" />
            <Text style={styles.dispatchBtnText}>Marcar Despachado</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  list: { padding: tokens.spacing[4], paddingBottom: tokens.spacing[10] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.colors.bgScreen },
  emptyContainer: { alignItems: 'center', marginTop: tokens.spacing[12] },
  emptyText: { color: tokens.colors.gray400, marginTop: tokens.spacing[3], fontSize: tokens.typography.size.base },
  card: { 
    backgroundColor: tokens.colors.bgLight, 
    borderRadius: tokens.radius.xl, 
    padding: tokens.spacing[4], 
    marginBottom: tokens.spacing[3],
    ...tokens.shadow.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing[3] },
  orderNo: { fontSize: tokens.typography.size.base, fontWeight: tokens.typography.weight.bold, color: tokens.colors.gray900 },
  date: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400 },
  statusBadge: { backgroundColor: tokens.colors.warning + '20', paddingHorizontal: tokens.spacing[2], paddingVertical: 2, borderRadius: tokens.radius.sm },
  statusText: { fontSize: 10, fontWeight: tokens.typography.weight.bold, color: tokens.colors.warning, textTransform: 'uppercase' },
  customerBox: { flexDirection: 'row', alignItems: 'center', marginBottom: tokens.spacing[4] },
  customer: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray600, marginLeft: tokens.spacing[1] },
  items: { borderTopWidth: 1, borderTopColor: tokens.colors.gray100, paddingTop: tokens.spacing[3], marginBottom: tokens.spacing[4] },
  item: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: tokens.spacing[1] },
  itemName: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray700, flex: 1 },
  itemQty: { fontSize: tokens.typography.size.sm, fontWeight: tokens.typography.weight.bold, color: tokens.colors.primary },
  dispatchBtn: { 
    backgroundColor: tokens.colors.primary, 
    borderRadius: tokens.radius.lg, 
    paddingVertical: tokens.spacing[3], 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center' 
  },
  dispatchBtnText: { color: '#fff', fontSize: tokens.typography.size.base, fontWeight: tokens.typography.weight.semibold, marginLeft: tokens.spacing[2] },
})

