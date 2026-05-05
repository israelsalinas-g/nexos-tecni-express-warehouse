import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { ProductCard } from '@/components/ProductCard'
import { supabase } from '@/lib/supabase'

interface ProductResult {
  id: string
  name_es: string
  sku: string
  brand: { name: string } | null
  stock: { warehouseId: string; warehouseName: string; quantity: number; stockMin: number }[]
}

export default function ScanScreen() {
  const navigation = useNavigation()
  const [product, setProduct] = useState<ProductResult | null>(null)
  const [notFound, setNotFound] = useState(false)

  async function handleScanned(sku: string) {
    setNotFound(false)
    setProduct(null)

    const { data: productData, error } = await supabase
      .from('products')
      .select('id, name_es, sku, brands(name)')
      .eq('sku', sku)
      .single()

    if (error || !productData) {
      setNotFound(true)
      return
    }

    // Fetch inventory across all warehouses
    const { data: inventoryRows } = await supabase
      .from('inventory')
      .select('quantity, stock_min, warehouses(id, name)')
      .eq('product_id', productData.id)

    const stock = (inventoryRows ?? []).map((row) => ({
      warehouseId:   (row.warehouses as { id: string; name: string } | null)?.id ?? '',
      warehouseName: (row.warehouses as { id: string; name: string } | null)?.name ?? 'Bodega',
      quantity:      row.quantity,
      stockMin:      row.stock_min,
    }))

    setProduct({
      id:     productData.id,
      name_es: productData.name_es,
      sku:    productData.sku,
      brand:  (productData.brands as { name: string } | null),
      stock,
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.scanner}>
        <BarcodeScanner onScanned={handleScanned} />
      </View>

      <ScrollView style={styles.results} contentContainerStyle={styles.resultsContent}>
        {notFound && (
          <View style={styles.notFound}>
            <Text style={styles.notFoundText}>Producto no encontrado</Text>
            <Text style={styles.notFoundSub}>Verifica que el SKU esté registrado en el catálogo.</Text>
          </View>
        )}

        {product && (
          <ProductCard
            name={product.name_es}
            sku={product.sku}
            brand={product.brand?.name}
            stock={product.stock}
          />
        )}

        {!notFound && !product && (
          <Text style={styles.placeholder}>
            Escanea un código de barras para ver la información del producto.
          </Text>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scanner:   { height: 280 },
  results:   { flex: 1 },
  resultsContent: { paddingVertical: 8, paddingBottom: 24 },
  placeholder: { textAlign: 'center', color: '#9ca3af', fontSize: 14, marginTop: 32, paddingHorizontal: 32 },
  notFound: { margin: 16, padding: 20, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center' },
  notFoundText: { fontSize: 16, fontWeight: '600', color: '#dc2626' },
  notFoundSub:  { fontSize: 13, color: '#6b7280', marginTop: 6, textAlign: 'center' },
})
