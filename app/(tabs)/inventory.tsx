import { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, ActivityIndicator, TextInput } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { InventoryList } from '@/components/common/InventoryList'
import { InventoryService } from '@/services/inventory.service'
import { InventoryRow } from '@/types/database.types'
import { tokens } from '@/theme/tokens'

export default function InventoryScreen() {
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch]       = useState('')

  const fetchInventory = useCallback(async () => {
    try {
      const data = await InventoryService.getAll()
      setInventory(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  const filtered = inventory.filter((item) => 
    item.products?.name_es?.toLowerCase().includes(search.toLowerCase()) ||
    item.products?.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchInventory()
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <View style={styles.searchWrapper}>
          <MaterialCommunityIcons name="magnify" size={20} color={tokens.colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o SKU..."
            placeholderTextColor={tokens.colors.gray400}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <InventoryList 
          data={filtered} 
          onRefresh={onRefresh} 
          refreshing={refreshing} 
          onItemPress={(item) => {
            console.log('Pressed item:', item.products?.sku)
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBox: { 
    padding: tokens.spacing[4], 
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray200,
    ...tokens.shadow.sm,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.gray100,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing[3],
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: tokens.spacing[2],
    fontSize: tokens.typography.size.base,
    color: tokens.colors.gray900,
  },
})
