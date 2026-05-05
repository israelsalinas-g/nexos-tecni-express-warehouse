import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, RefreshControl,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { StockBadge } from '@/components/StockBadge'

interface Warehouse { id: string; name: string }

interface InventoryRow {
  id: string
  productName: string
  sku: string
  quantity: number
  stockMin: number
}

export default function InventoryScreen() {
  const [warehouses, setWarehouses]     = useState<Warehouse[]>([])
  const [selectedWh, setSelectedWh]     = useState<string | null>(null)
  const [rows, setRows]                 = useState<InventoryRow[]>([])
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)

  useEffect(() => {
    supabase
      .from('warehouses')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setWarehouses(data)
          setSelectedWh(data[0].id)
        }
      })
  }, [])

  const fetchInventory = useCallback(async () => {
    if (!selectedWh) return
    setLoading(true)

    let query = supabase
      .from('inventory')
      .select('id, quantity, stock_min, products(id, name_es, sku)')
      .eq('warehouse_id', selectedWh)
      .order('quantity', { ascending: true })

    const { data } = await query
    const mapped = (data ?? [])
      .map((r) => ({
        id:          r.id,
        productName: (r.products as { id: string; name_es: string; sku: string } | null)?.name_es ?? '',
        sku:         (r.products as { id: string; name_es: string; sku: string } | null)?.sku ?? '',
        quantity:    r.quantity,
        stockMin:    r.stock_min,
      }))
      .filter((r) =>
        !search ||
        r.productName.toLowerCase().includes(search.toLowerCase()) ||
        r.sku.toLowerCase().includes(search.toLowerCase()),
      )

    setRows(mapped)
    setLoading(false)
  }, [selectedWh, search])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  async function onRefresh() {
    setRefreshing(true)
    await fetchInventory()
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      {/* Warehouse selector */}
      <View style={styles.tabBar}>
        {warehouses.map((wh) => (
          <TouchableOpacity
            key={wh.id}
            style={[styles.tab, selectedWh === wh.id && styles.tabActive]}
            onPress={() => setSelectedWh(wh.id)}
          >
            <Text style={[styles.tabText, selectedWh === wh.id && styles.tabTextActive]}>
              {wh.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <TextInput
        style={styles.search}
        placeholder="Buscar por nombre o SKU..."
        placeholderTextColor="#9ca3af"
        value={search}
        onChangeText={setSearch}
        clearButtonMode="while-editing"
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Sin resultados para esta bodega.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>{item.productName}</Text>
                <Text style={styles.rowSku}>{item.sku}</Text>
              </View>
              <StockBadge quantity={item.quantity} stockMin={item.stockMin} />
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  tabText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  tabTextActive: { color: '#2563eb', fontWeight: '700' },
  search: {
    margin: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 14 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowInfo:  { flex: 1, marginRight: 12 },
  rowName:  { fontSize: 15, color: '#111827', fontWeight: '500' },
  rowSku:   { fontSize: 12, color: '#6b7280', marginTop: 2 },
})
