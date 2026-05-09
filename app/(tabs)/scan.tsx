import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { ProductCard } from '@/components/ProductCard'
import { ProductService } from '@/services/product.service'
import { InventoryService } from '@/services/inventory.service'
import { Product } from '@/types/database.types'

export default function ScanScreen() {
  const [product, setProduct] = useState<any | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleScanned(sku: string) {
    setNotFound(false)
    setProduct(null)
    setLoading(true)

    try {
      const productData = await ProductService.getBySku(sku)

      if (!productData) {
        setNotFound(true)
        return
      }

      // Fetch inventory across all warehouses
      const stock = await InventoryService.getStockByProduct(productData.id)

      setProduct({
        ...productData,
        stock,
      })
    } catch (error) {
      console.error('Scan error:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
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
            <Text style={styles.notFoundSub}>
              El SKU "{product?.sku || ''}" no está registrado en el catálogo.
            </Text>
          </View>
        )}

        {product && (
          <ProductCard
            name={product.name_es}
            sku={product.sku}
            brand={product.brand_id} // Ideally we'd join brand name in service
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

