import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  View, StyleSheet, ActivityIndicator, TextInput, 
  ScrollView, TouchableOpacity, Text 
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { ProductList } from '@/components/common/ProductList'
import { InventoryService } from '@/services/inventory.service'
import { InventoryRow } from '@/types/database.types'
import { tokens } from '@/theme/tokens'

export default function InventoryScreen() {
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      console.log('Fetching inventory data...')
      const [invResult, brandResult, catResult] = await Promise.allSettled([
        InventoryService.getAll(),
        InventoryService.getBrands(),
        InventoryService.getCategories()
      ])

      if (invResult.status === 'fulfilled') {
        console.log('Inventory loaded:', invResult.value.length, 'rows')
        setInventory(invResult.value)
      } else {
        console.error('Inventory error:', invResult.reason)
      }

      if (brandResult.status === 'fulfilled') {
        console.log('Brands loaded:', brandResult.value.length)
        setBrands(brandResult.value)
      } else {
        console.error('Brands error:', brandResult.reason)
      }

      if (catResult.status === 'fulfilled') {
        console.log('Categories loaded:', catResult.value.length)
        setCategories(catResult.value)
      } else {
        console.error('Categories error:', catResult.reason)
      }

    } catch (error) {
      console.error('Global fetch error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])


  useEffect(() => { fetchData() }, [fetchData])

  // Group inventory by product
  const groupedInventory = useMemo(() => {
    const map = new Map<string, any>()

    inventory.forEach((row) => {
      if (!row.product_id) return
      
      const product = row.products
      if (!product) return

      // Apply Filters
      const matchesSearch = !search || 
        product.name_es?.toLowerCase().includes(search.toLowerCase()) ||
        product.sku?.toLowerCase().includes(search.toLowerCase())
      
      const matchesBrand = !selectedBrand || product.brand_id === selectedBrand
      const matchesCategory = !selectedCategory || product.category_id === selectedCategory

      if (matchesSearch && matchesBrand && matchesCategory) {
        if (!map.has(row.product_id)) {
          map.set(row.product_id, {
            productId: row.product_id,
            name: product.name_es,
            sku: product.sku,
            brandName: product.brands?.name || 'Genérico',
            categoryName: 'Repuestos', // Mock if not in joins, usually categories join needed
            totalStock: 0,
            warehouses: []
          })
        }

        const grouped = map.get(row.product_id)
        grouped.totalStock += row.quantity
        grouped.warehouses.push({
          name: row.warehouses?.name || 'Bodega',
          code: row.warehouses?.code || 'N/A',
          quantity: row.quantity
        })
      }
    })

    return Array.from(map.values())
  }, [inventory, search, selectedBrand, selectedCategory])

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Inventario</Text>
          <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
            <MaterialCommunityIcons name="plus" size={20} color={tokens.colors.primary} />
            <Text style={styles.addButtonText}>Nuevo</Text>
          </TouchableOpacity>
        </View>

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

        <View style={styles.filterSection}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Marcas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContent}>
              <TouchableOpacity 
                style={[styles.chip, !selectedBrand && styles.chipActive]} 
                onPress={() => setSelectedBrand(null)}
              >
                <Text style={[styles.chipText, !selectedBrand && styles.chipTextActive]}>Todas</Text>
              </TouchableOpacity>
              {brands.map((b) => (
                <TouchableOpacity 
                  key={b.id} 
                  style={[styles.chip, selectedBrand === b.id && styles.chipActive]} 
                  onPress={() => setSelectedBrand(b.id)}
                >
                  <Text style={[styles.chipText, selectedBrand === b.id && styles.chipTextActive]}>{b.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Categorías</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContent}>
              <TouchableOpacity 
                style={[styles.chip, !selectedCategory && styles.chipActiveSecondary]} 
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>Todas</Text>
              </TouchableOpacity>
              {categories.map((c) => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.chip, selectedCategory === c.id && styles.chipActiveSecondary]} 
                  onPress={() => setSelectedCategory(c.id)}
                >
                  <Text style={[styles.chipText, selectedCategory === c.id && styles.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <ProductList 
          data={groupedInventory} 
          onRefresh={onRefresh} 
          refreshing={refreshing} 
          onItemPress={(item) => {
            router.push(`/product/${item.sku}`)
          }}

        />
      )}

      {/* FAB (Optional, since we have 'Nuevo' button above, but keeping for mobile feel) */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => console.log('Add product')}
        activeOpacity={0.9}
      >
        <MaterialCommunityIcons name="barcode-scan" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    paddingTop: tokens.spacing[4],
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray200 + '50',
    ...tokens.shadow.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[4],
    marginBottom: tokens.spacing[4],
  },
  title: {
    fontSize: tokens.typography.size['2xl'],
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.gray900,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primary + '15',
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: 6,
    borderRadius: tokens.radius.lg,
  },
  addButtonText: {
    color: tokens.colors.primary,
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 13,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.gray50,
    borderRadius: tokens.radius.xl,
    paddingHorizontal: tokens.spacing[4],
    height: 46,
    marginHorizontal: tokens.spacing[4],
    marginBottom: tokens.spacing[4],
    borderWidth: 1,
    borderColor: tokens.colors.gray200,
  },
  searchInput: {
    flex: 1,
    marginLeft: tokens.spacing[2],
    fontSize: tokens.typography.size.base,
    color: tokens.colors.gray900,
  },
  filterSection: {
    marginBottom: tokens.spacing[2],
  },
  filterGroup: {
    marginBottom: tokens.spacing[1],
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    marginLeft: tokens.spacing[4],
  },
  chipScroll: {
    marginBottom: tokens.spacing[2],
  },
  chipContent: {
    paddingHorizontal: tokens.spacing[4],
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: tokens.spacing[5],
    paddingVertical: 8,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.bgLight,
    marginRight: tokens.spacing[2],
    borderWidth: 1,
    borderColor: tokens.colors.gray200,
    ...tokens.shadow.sm,
  },

  chipActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  chipActiveSecondary: {
    backgroundColor: tokens.colors.secondary,
    borderColor: tokens.colors.secondary,
  },
  chipText: {
    fontSize: 12,
    color: tokens.colors.gray600,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: tokens.spacing[6],
    right: tokens.spacing[6],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...tokens.shadow.lg,
  },
})


