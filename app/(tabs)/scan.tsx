import { useState } from 'react'
import { useRouter } from 'expo-router'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { BarcodeScanner } from '@/components/common/BarcodeScanner'
import { ProductService } from '@/services/product.service'
import { InventoryService } from '@/services/inventory.service'
import { tokens } from '@/theme/tokens'

export default function ScanScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [lastScan, setLastScan] = useState<any>(null)

  const handleScanned = async (sku: string) => {
    setLoading(true)
    try {
      const product = await ProductService.getBySku(sku)
      if (!product) {
        Alert.alert('No encontrado', `El SKU ${sku} no existe en el sistema.`)
        return
      }

      const inventory = await InventoryService.getByProduct(product.id)
      setLastScan({ product, inventory })
    } catch (error) {
      console.error(error)
      Alert.alert('Error', 'Ocurrió un error al buscar el producto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.title}>Scanner</Text>
      </View>

      <View style={styles.scannerWrapper}>
        <BarcodeScanner onScanned={handleScanned} />
      </View>

      <View style={styles.resultContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        ) : lastScan ? (
          <View style={styles.resultCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{lastScan.product.name_es}</Text>
              <Text style={styles.productSku}>{lastScan.product.sku}</Text>
            </View>
            <View style={styles.stockInfo}>
              {lastScan.inventory.map((inv: any) => (
                <View key={inv.warehouse_id} style={styles.stockRow}>
                  <Text style={styles.warehouseName}>{inv.warehouses?.name}</Text>
                  <Text style={styles.stockQty}>{inv.quantity} unid.</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.clearBtn} 
              onPress={() => setLastScan(null)}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Limpiar resultado"
            >
              <Text style={styles.clearBtnText}>Escanear otro</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="barcode-scan" size={48} color={tokens.colors.gray200} />
            <Text style={styles.emptyText}>Escanea un producto para ver stock</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  backBtn: { padding: 4 },
  title: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: tokens.colors.gray900, flex: 1, marginLeft: 12 },
  scannerWrapper: { height: '40%', backgroundColor: '#000' },
  resultContainer: { 
    flex: 1, 
    padding: tokens.spacing[4], 
    justifyContent: 'center' 
  },
  resultCard: { 
    backgroundColor: tokens.colors.bgLight, 
    borderRadius: tokens.radius.xl, 
    padding: tokens.spacing[5],
    ...tokens.shadow.lg,
  },
  productInfo: { marginBottom: tokens.spacing[4], borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100, paddingBottom: tokens.spacing[3] },
  productName: { fontSize: tokens.typography.size.lg, fontWeight: tokens.typography.weight.bold, color: tokens.colors.gray900 },
  productSku: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray400, marginTop: 2 },
  stockInfo: { marginBottom: tokens.spacing[5] },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: tokens.spacing[2] },
  warehouseName: { fontSize: tokens.typography.size.base, color: tokens.colors.gray600 },
  stockQty: { fontSize: tokens.typography.size.base, fontWeight: tokens.typography.weight.bold, color: tokens.colors.primary },
  clearBtn: { backgroundColor: tokens.colors.secondary, paddingVertical: tokens.spacing[3], borderRadius: tokens.radius.lg, alignItems: 'center' },
  clearBtnText: { color: tokens.colors.bgLight, fontWeight: tokens.typography.weight.semibold },
  emptyState: { alignItems: 'center' },
  emptyText: { marginTop: tokens.spacing[3], color: tokens.colors.gray400, textAlign: 'center' },
})
