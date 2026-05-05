import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert,
} from 'react-native'
import { supabase } from '@/lib/supabase'

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
  // Current user's warehouse_id
  const [warehouseId, setWarehouseId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get the default (or assigned) warehouse — for now use default
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

    const mapped: Order[] = (data ?? []).map((o) => ({
      id:        o.id,
      orderNo:   o.order_number,
      customer:  (o.profiles as { full_name: string } | null)?.full_name ?? 'Cliente',
      createdAt: new Date(o.created_at).toLocaleDateString('es-HN'),
      items:     (o.order_items as OrderItem[] ?? []).map((i: { product_name_es: string; sku: string; quantity: number }) => ({
        productName: i.product_name_es,
        sku:         i.sku,
        quantity:    i.quantity,
      })),
    }))

    setOrders(mapped)
    setLoading(false)
  }, [warehouseId])

  useEffect(() => { if (warehouseId !== undefined) fetchOrders() }, [fetchOrders, warehouseId])

  async function onRefresh() {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }

  async function markDispatched(orderId: string) {
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

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#2563eb" />
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <Text style={styles.empty}>No hay órdenes pendientes de despacho.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderNo}>Orden #{item.orderNo}</Text>
            <Text style={styles.date}>{item.createdAt}</Text>
          </View>
          <Text style={styles.customer}>{item.customer}</Text>

          <View style={styles.items}>
            {item.items.map((i, idx) => (
              <View key={idx} style={styles.item}>
                <Text style={styles.itemName} numberOfLines={1}>{i.productName}</Text>
                <Text style={styles.itemQty}>× {i.quantity}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.dispatchBtn} onPress={() => markDispatched(item.id)}>
            <Text style={styles.dispatchBtnText}>Marcar como despachado</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  list:        { padding: 16, backgroundColor: '#f3f4f6', flexGrow: 1 },
  empty:       { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 14 },
  card:        { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderNo:     { fontSize: 16, fontWeight: '700', color: '#111827' },
  date:        { fontSize: 13, color: '#6b7280' },
  customer:    { fontSize: 14, color: '#374151', marginBottom: 12 },
  items:       { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, marginBottom: 14 },
  item:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName:    { fontSize: 13, color: '#374151', flex: 1 },
  itemQty:     { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  dispatchBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  dispatchBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
