import { useEffect, useState } from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/ProductCard'

export default function ProductDetailScreen() {
  const { sku }     = useLocalSearchParams<{ sku: string }>()
  const navigation  = useNavigation()
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [product, setProduct]   = useState<{
    name: string; sku: string; brand?: string;
    stock: { warehouseId: string; warehouseName: string; quantity: number; stockMin: number }[]
  } | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('id, name_es, sku, brands(name)')
        .eq('sku', sku)
        .single()

      if (!data) { setNotFound(true); setLoading(false); return }

      navigation.setOptions({ title: data.name_es })

      const { data: inv } = await supabase
        .from('inventory')
        .select('quantity, stock_min, warehouses(id, name)')
        .eq('product_id', data.id)

      setProduct({
        name:  data.name_es,
        sku:   data.sku,
        brand: (data.brands as { name: string } | null)?.name,
        stock: (inv ?? []).map((r) => ({
          warehouseId:   (r.warehouses as { id: string; name: string } | null)?.id ?? '',
          warehouseName: (r.warehouses as { id: string; name: string } | null)?.name ?? 'Bodega',
          quantity:      r.quantity,
          stockMin:      r.stock_min,
        })),
      })
      setLoading(false)
    }
    load()
  }, [sku])

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#2563eb" />
  }

  if (notFound) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundText}>Producto no encontrado</Text>
        <Text style={styles.notFoundSub}>SKU: {sku}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {product && (
        <ProductCard
          name={product.name}
          sku={product.sku}
          brand={product.brand}
          stock={product.stock}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f3f4f6', paddingVertical: 8 },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  notFoundText: { fontSize: 18, fontWeight: '600', color: '#dc2626' },
  notFoundSub:  { fontSize: 14, color: '#6b7280', marginTop: 8 },
})
