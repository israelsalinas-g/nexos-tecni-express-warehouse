import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert,
} from 'react-native'
import { supabase } from '@/lib/supabase'

interface TransferItem {
  productName: string
  sku:         string
  quantity:    number
}

interface Transfer {
  id:             string
  transferNo:     string
  fromWarehouse:  string
  toWarehouse:    string
  createdAt:      string
  items:          TransferItem[]
}

export default function TransfersScreen() {
  const [transfers, setTransfers]     = useState<Transfer[]>([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)

  const fetchTransfers = useCallback(async () => {
    setLoading(true)

    const { data } = await supabase
      .from('warehouse_transfers')
      .select(`
        id, transfer_number, status, created_at,
        from_warehouse:warehouses!from_warehouse_id(name),
        to_warehouse:warehouses!to_warehouse_id(name),
        warehouse_transfer_items(quantity, products(name_es, sku))
      `)
      .eq('status', 'in_transit')
      .order('created_at', { ascending: true })

    const mapped: Transfer[] = (data ?? []).map((t) => ({
      id:            t.id,
      transferNo:    t.transfer_number,
      fromWarehouse: (t.from_warehouse as { name: string } | null)?.name ?? '—',
      toWarehouse:   (t.to_warehouse as { name: string } | null)?.name ?? '—',
      createdAt:     new Date(t.created_at).toLocaleDateString('es-HN'),
      items:         (t.warehouse_transfer_items as { quantity: number; products: { name_es: string; sku: string } | null }[] ?? []).map((i) => ({
        productName: i.products?.name_es ?? '—',
        sku:         i.products?.sku ?? '—',
        quantity:    i.quantity,
      })),
    }))

    setTransfers(mapped)
    setLoading(false)
  }, [])

  useEffect(() => { fetchTransfers() }, [fetchTransfers])

  async function onRefresh() {
    setRefreshing(true)
    await fetchTransfers()
    setRefreshing(false)
  }

  async function confirmReceived(transferId: string) {
    Alert.alert('Confirmar recepción', '¿Confirmar que recibiste este traslado?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          const { error } = await supabase.functions.invoke('receive-transfer', {
            body: { transfer_id: transferId },
          })
          if (error) { Alert.alert('Error', error.message); return }
          setTransfers((prev) => prev.filter((t) => t.id !== transferId))
        },
      },
    ])
  }

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#2563eb" />
  }

  return (
    <FlatList
      data={transfers}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <Text style={styles.empty}>No hay traslados pendientes de recepción.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.transferNo}>Traslado #{item.transferNo}</Text>
            <Text style={styles.date}>{item.createdAt}</Text>
          </View>

          <View style={styles.route}>
            <Text style={styles.routeText}>{item.fromWarehouse}</Text>
            <Text style={styles.arrow}> → </Text>
            <Text style={[styles.routeText, styles.routeDestination]}>{item.toWarehouse}</Text>
          </View>

          <View style={styles.items}>
            {item.items.map((i, idx) => (
              <View key={idx} style={styles.item}>
                <Text style={styles.itemName} numberOfLines={1}>{i.productName}</Text>
                <Text style={styles.itemQty}>× {i.quantity}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.receiveBtn} onPress={() => confirmReceived(item.id)}>
            <Text style={styles.receiveBtnText}>Confirmar recepción</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  list:            { padding: 16, backgroundColor: '#f3f4f6', flexGrow: 1 },
  empty:           { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 14 },
  card:            { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  transferNo:      { fontSize: 16, fontWeight: '700', color: '#111827' },
  date:            { fontSize: 13, color: '#6b7280' },
  route:           { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  routeText:       { fontSize: 14, color: '#374151', fontWeight: '500' },
  routeDestination: { color: '#2563eb' },
  arrow:           { fontSize: 16, color: '#9ca3af' },
  items:           { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, marginBottom: 14 },
  item:            { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName:        { fontSize: 13, color: '#374151', flex: 1 },
  itemQty:         { fontSize: 13, fontWeight: '600', color: '#374151' },
  receiveBtn:      { backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  receiveBtnText:  { color: '#fff', fontSize: 15, fontWeight: '600' },
})
