import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { FlashList } from '@shopify/flash-list'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { InventoryCountService } from '@/services/inventory-count.service'
import { ProductService } from '@/services/product.service'
import { InventoryService } from '@/services/inventory.service'
import { ScannerInput } from '@/components/common/ScannerInput'

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
  const [saving, setSaving] = useState(false)

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
        systemQty:   0, // In real app, join or fetch system qty
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

      // Check if already in list
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
          setSaving(true)
          try {
            await InventoryCountService.completeSession(sessionId)
            Alert.alert('Éxito', 'Conteo finalizado.')
            router.back()
          } catch (e: any) {
            Alert.alert('Error', e.message)
          } finally {
            setSaving(false)
          }
        }
      }
    ])
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 100 }} size="large" color="#2563eb" />

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
                <MaterialCommunityIcons name="minus" size={20} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.countValue}>{item.counted}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.countBtn}>
                <MaterialCommunityIcons name="plus" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No has escaneado productos aún.</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  warehouseName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sessionStatus: { fontSize: 10, fontWeight: '800', color: '#16a34a', marginTop: 2 },
  finishBtn: { backgroundColor: '#374151', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  finishBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  scannerBox: { padding: 16, backgroundColor: '#fff' },
  list: { padding: 16, paddingBottom: 40 },
  itemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 8 
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  itemSku: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  counter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8, padding: 4 },
  countBtn: { padding: 6 },
  countValue: { fontSize: 16, fontWeight: '700', color: '#111827', width: 30, textAlign: 'center' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#9ca3af', marginTop: 12, fontSize: 14 },
})

