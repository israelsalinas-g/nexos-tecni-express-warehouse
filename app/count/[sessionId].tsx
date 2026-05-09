import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Alert, 
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { FlashList } from '@shopify/flash-list'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { InventoryCountService } from '@/services/inventory-count.service'
import { ProductService } from '@/services/product.service'
import { ScannerInput } from '@/components/common/ScannerInput'
import { tokens } from '@/theme/tokens'

interface CountItem {
  id:          string
  productId:   string
  productName: string
  sku:         string
  systemQty:   number
  counted:     number
}

export default function CountSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const [session, setSession] = useState<any>(null)
  const [items, setItems] = useState<CountItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!sessionId) return
    try {
      const sessionData = await InventoryCountService.getSession(sessionId)
      setSession(sessionData)
      
      const itemsData = await InventoryCountService.getItems(sessionId)
      const mapped: CountItem[] = itemsData.map((i: any) => ({
        id:          i.id,
        productId:   i.product_id,
        productName: i.products?.name_es || '—',
        sku:         i.products?.sku || '—',
        systemQty:   0,
        counted:     i.counted_quantity,
      }))
      setItems(mapped)
    } catch (e) {
      console.error(e)
      Alert.alert('Error', 'No se pudo cargar la sesión.')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => { loadData() }, [loadData])

  const handleScanned = async (sku: string) => {
    try {
      const product = await ProductService.getBySku(sku)
      if (!product) {
        Alert.alert('No encontrado', `El SKU ${sku} no existe en el catálogo.`)
        return
      }

      const exists = items.find(i => i.productId === product.id)
      if (exists) {
        Alert.alert('Aviso', 'Este producto ya está en la lista de conteo.')
        return
      }

      const newItem = await InventoryCountService.addItem(sessionId, product.id, 1)
      setItems(prev => [
        {
          id:          newItem.id,
          productId:   product.id,
          productName: product.name_es,
          sku:         product.sku,
          systemQty:   0,
          counted:     1,
        },
        ...prev,
      ])
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  const updateQuantity = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    
    const newQty = Math.max(0, item.counted + delta)
    setItems(prev => prev.map(i => i.id === id ? { ...i, counted: newQty } : i))
    
    try {
      await InventoryCountService.updateItemQuantity(id, newQty)
    } catch (e) {
      console.error('Error updating qty:', e)
    }
  }

  const handleFinish = async () => {
    Alert.alert('Finalizar Conteo', '¿Deseas cerrar esta sesión de conteo? No podrás hacer más cambios.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        onPress: async () => {
          try {
            await InventoryCountService.completeSession(sessionId)
            Alert.alert('Éxito', 'Conteo finalizado.')
            router.back()
          } catch (e: any) {
            Alert.alert('Error', e.message)
          }
        }
      }
    ])
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.warehouseName}>{session?.warehouses?.name || 'Bodega'}</Text>
          <Text style={styles.sessionStatus}>SESIÓN ACTIVA • {items.length} ÍTEMS</Text>
        </View>
        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Text style={styles.finishBtnText}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.scannerBox}>
        <ScannerInput 
          value="" 
          onChangeText={handleScanned} 
          placeholder="Escanear producto para agregar..." 
        />
      </View>

      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
              <Text style={styles.itemSku}>{item.sku}</Text>
            </View>
            <View style={styles.counter}>
              <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.countBtn}>
                <MaterialCommunityIcons name="minus" size={20} color={tokens.colors.gray600} />
              </TouchableOpacity>
              <Text style={styles.countValue}>{item.counted}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.countBtn}>
                <MaterialCommunityIcons name="plus" size={20} color={tokens.colors.gray600} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={tokens.colors.gray200} />
            <Text style={styles.emptyText}>No has escaneado productos aún.</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: tokens.spacing[4], 
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray200,
    ...tokens.shadow.sm,
  },
  warehouseName: { fontSize: tokens.typography.size.lg, fontWeight: tokens.typography.weight.bold, color: tokens.colors.gray900 },
  sessionStatus: { fontSize: tokens.typography.size.xs, fontWeight: tokens.typography.weight.extrabold, color: tokens.colors.success, marginTop: 2 },
  finishBtn: { backgroundColor: tokens.colors.secondary, paddingHorizontal: tokens.spacing[4], paddingVertical: tokens.spacing[2], borderRadius: tokens.radius.md },
  finishBtnText: { color: tokens.colors.bgLight, fontWeight: tokens.typography.weight.semibold, fontSize: tokens.typography.size.sm },
  scannerBox: { padding: tokens.spacing[4], backgroundColor: tokens.colors.bgLight },
  list: { padding: tokens.spacing[4], paddingBottom: tokens.spacing[10] },
  itemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: tokens.colors.bgLight, 
    padding: tokens.spacing[3], 
    borderRadius: tokens.radius.lg, 
    marginBottom: tokens.spacing[2],
    ...tokens.shadow.sm,
  },
  itemInfo: { flex: 1, marginRight: tokens.spacing[3] },
  itemName: { fontSize: tokens.typography.size.base, fontWeight: tokens.typography.weight.semibold, color: tokens.colors.gray900 },
  itemSku: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 2 },
  counter: { flexDirection: 'row', alignItems: 'center', backgroundColor: tokens.colors.gray50, borderRadius: tokens.radius.md, padding: 4 },
  countBtn: { padding: tokens.spacing[1] },
  countValue: { fontSize: tokens.typography.size.base, fontWeight: tokens.typography.weight.bold, color: tokens.colors.gray900, width: 30, textAlign: 'center' },
  empty: { alignItems: 'center', marginTop: tokens.spacing[10] },
  emptyText: { color: tokens.colors.gray400, marginTop: tokens.spacing[3], fontSize: tokens.typography.size.base },
})


