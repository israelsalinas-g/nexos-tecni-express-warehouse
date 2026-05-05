import { useEffect, useState, useRef } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { BarcodeScanner } from '@/components/BarcodeScanner'

interface CountItem {
  id:          string
  productId:   string
  productName: string
  sku:         string
  systemQty:   number
  counted:     string
}

export default function CountSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const navigation     = useNavigation()
  const [items, setItems]         = useState<CountItem[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase
        .from('inventory_count_sessions')
        .select('id, warehouse_id, notes, warehouses(name)')
        .eq('id', sessionId)
        .single()

      if (!session) { setLoading(false); return }

      navigation.setOptions({ title: `Conteo — ${(session.warehouses as { name: string } | null)?.name ?? 'Bodega'}` })

      const { data: existingItems } = await supabase
        .from('inventory_count_items')
        .select('id, product_id, counted_quantity, products(name_es, sku)')
        .eq('session_id', sessionId)

      if (existingItems && existingItems.length > 0) {
        const mapped: CountItem[] = existingItems.map((i) => ({
          id:          i.id,
          productId:   i.product_id,
          productName: (i.products as { name_es: string; sku: string } | null)?.name_es ?? '—',
          sku:         (i.products as { name_es: string; sku: string } | null)?.sku ?? '—',
          systemQty:   0,
          counted:     String(i.counted_quantity),
        }))
        setItems(mapped)
      }

      setLoading(false)
    }
    load()
  }, [sessionId])

  async function handleScanned(sku: string) {
    // Check if product already in the list
    const { data: product } = await supabase
      .from('products')
      .select('id, name_es, sku')
      .eq('sku', sku)
      .single()

    if (!product) {
      Alert.alert('Producto no encontrado', `SKU: ${sku}`)
      return
    }

    const exists = items.find((i) => i.productId === product.id)
    if (exists) {
      Alert.alert('Ya escaneado', `${product.name_es} ya está en la lista.`)
      return
    }

    // Get system qty for this session's warehouse
    const { data: session } = await supabase
      .from('inventory_count_sessions')
      .select('warehouse_id')
      .eq('id', sessionId)
      .single()

    const { data: inv } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', product.id)
      .eq('warehouse_id', session?.warehouse_id ?? '')
      .single()

    // Insert into inventory_count_items
    const { data: newItem } = await supabase
      .from('inventory_count_items')
      .insert({
        session_id:        sessionId,
        product_id:        product.id,
        counted_quantity:  0,
      })
      .select('id')
      .single()

    if (!newItem) return

    setItems((prev) => [
      ...prev,
      {
        id:          newItem.id,
        productId:   product.id,
        productName: product.name_es,
        sku:         product.sku,
        systemQty:   inv?.quantity ?? 0,
        counted:     '0',
      },
    ])
    setShowScanner(false)
  }

  async function updateCounted(itemId: string, value: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, counted: value } : i)),
    )

    const parsed = parseInt(value, 10)
    if (!isNaN(parsed)) {
      await supabase
        .from('inventory_count_items')
        .update({ counted_quantity: parsed })
        .eq('id', itemId)
    }
  }

  async function handleClose() {
    setSaving(true)
    const { error } = await supabase
      .from('inventory_count_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId)
    setSaving(false)

    if (error) { Alert.alert('Error', error.message); return }
    Alert.alert('Conteo cerrado', 'La sesión de conteo ha sido guardada.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ])
  }

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#2563eb" />
  }

  if (showScanner) {
    return (
      <View style={{ flex: 1 }}>
        <BarcodeScanner onScanned={handleScanned} />
        <TouchableOpacity style={styles.cancelScanBtn} onPress={() => setShowScanner(false)}>
          <Text style={styles.cancelScanText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity style={styles.scanBtn} onPress={() => setShowScanner(true)}>
        <Text style={styles.scanBtnText}>+ Escanear producto</Text>
      </TouchableOpacity>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Escanea productos para agregarlos al conteo.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName} numberOfLines={1}>{item.productName}</Text>
              <Text style={styles.rowSku}>{item.sku}  •  Sistema: {item.systemQty}</Text>
            </View>
            <TextInput
              style={styles.qtyInput}
              value={item.counted}
              onChangeText={(v) => updateCounted(item.id, v)}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>
        )}
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.closeBtn, saving && styles.closeBtnDisabled]}
            onPress={handleClose}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.closeBtnText}>Cerrar conteo</Text>}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#f3f4f6' },
  scanBtn:           { margin: 16, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  scanBtnText:       { color: '#fff', fontSize: 15, fontWeight: '600' },
  list:              { paddingHorizontal: 16, paddingBottom: 24 },
  empty:             { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 14 },
  row:               { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  rowInfo:           { flex: 1, marginRight: 12 },
  rowName:           { fontSize: 14, color: '#111827', fontWeight: '500' },
  rowSku:            { fontSize: 12, color: '#6b7280', marginTop: 3 },
  qtyInput:          { width: 60, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingVertical: 8, textAlign: 'center', fontSize: 16, color: '#111827', backgroundColor: '#f9fafb' },
  footer:            { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  closeBtn:          { backgroundColor: '#374151', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  closeBtnDisabled:  { opacity: 0.6 },
  closeBtnText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelScanBtn:     { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24 },
  cancelScanText:    { color: '#fff', fontSize: 15, fontWeight: '600' },
})
