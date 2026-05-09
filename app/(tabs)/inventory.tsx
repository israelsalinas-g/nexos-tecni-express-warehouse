import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { InventoryService } from '@/services/inventory.service'
import { InventoryList } from '@/components/common/InventoryList'
import { Warehouse, InventoryRow } from '@/types/database.types'

export default function InventoryScreen() {
  const [warehouses, setWarehouses]     = useState<Warehouse[]>([])
  const [selectedWh, setSelectedWh]     = useState<string | null>(null)
  const [rows, setRows]                 = useState<InventoryRow[]>([])
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)

  // Load active warehouses on mount
  useEffect(() => {
    supabase
      .from('warehouses')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data && data.length > 0) {
          const whs = data as Warehouse[]
          setWarehouses(whs)
          setSelectedWh(whs[0].id)
        }
      })
  }, [])

  const fetchInventory = useCallback(async () => {
    if (!selectedWh) return
    setLoading(true)
    try {
      const data = await InventoryService.getByWarehouse(selectedWh, search)
      setRows(data)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedWh, search])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  async function onRefresh() {
    setRefreshing(true)
    await fetchInventory()
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      {/* Warehouse selector (Tabs) */}
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

      {/* Search Bar */}
      <TextInput
        style={styles.search}
        placeholder="Buscar por nombre o SKU..."
        placeholderTextColor="#9ca3af"
        value={search}
        onChangeText={setSearch}
        clearButtonMode="while-editing"
      />

      {loading && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563eb" />
      ) : (
        <InventoryList 
          data={rows} 
          onRefresh={onRefresh} 
          refreshing={refreshing}
          onPressItem={(item) => {
            // TODO: Navigate to inventory details/adjustment
            console.log('Pressed item:', item.product.sku)
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 8,
  },
  tab: { 
    flex: 1, 
    paddingVertical: 14, 
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#2563eb' },
  tabText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#2563eb' },
  search: {
    margin: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    // Slight shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
})

