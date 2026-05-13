import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { supabase } from '@/lib/supabase'

interface POItem {
  id:          string
  productId:   string
  productName: string
  sku:         string
  orderedQty:  number
  received:    string   // text input value
}

export default function ReceivePOScreen() {
  const { poId }     = useLocalSearchParams<{ poId: string }>()
  const navigation   = useNavigation()
  const [items, setItems]       = useState<POItem[]>([])
  const [poNumber, setPoNumber] = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('purchase_orders')
        .select(`
          id, po_number, status,
          purchase_order_items(id, product_id, quantity_ordered, products(name_es, sku))
        `)
        .eq('id', poId)
        .single()

      if (!data) { setLoading(false); return }

      setPoNumber(data.po_number)
      navigation.setOptions({ title: `Recepción OC #${data.po_number}` })

      const mapped: POItem[] = ((data.purchase_order_items ?? []) as unknown as {
        id: string; product_id: string; quantity_ordered: number;
        products: { name_es: string; sku: string } | null
      }[]).map((i) => ({
        id:          i.id,
        productId:   i.product_id,
        productName: i.products?.name_es ?? '—',
        sku:         i.products?.sku ?? '—',
        orderedQty:  i.quantity_ordered,
        received:    String(i.quantity_ordered),
      }))

      setItems(mapped)
      setLoading(false)
    }
    load()
  }, [poId])

  function updateQty(itemId: string, value: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, received: value } : i)),
    )
  }

  async function handleConfirm() {
    const payload = items.map((i) => ({
      poItemId:   i.id,
      productId:  i.productId,
      receivedQty: parseInt(i.received, 10) || 0,
    }))

    const invalid = payload.some((p) => p.receivedQty < 0)
    if (invalid) { Alert.alert('Error', 'Las cantidades deben ser 0 o mayor.'); return }

    setSaving(true)

    const { error } = await supabase.rpc('increment_stock_on_po_receipt', {
      p_po_id:    poId,
      p_receipts: payload,
    })

    setSaving(false)

    if (error) { Alert.alert('Error al recibir', error.message); return }

    Alert.alert('Recepción confirmada', `OC #${poNumber} recibida correctamente.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ])
  }

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#2563eb" />
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName} numberOfLines={2}>{item.productName}</Text>
              <Text style={styles.rowSku}>{item.sku}  •  Pedido: {item.orderedQty}</Text>
            </View>
            <TextInput
              style={styles.qtyInput}
              value={item.received}
              onChangeText={(v) => updateQty(item.id, v)}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, saving && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.confirmBtnText}>Confirmar recepción</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f3f4f6' },
  list:               { padding: 16, paddingBottom: 24 },
  row:                { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  rowInfo:            { flex: 1, marginRight: 12 },
  rowName:            { fontSize: 14, color: '#111827', fontWeight: '500' },
  rowSku:             { fontSize: 12, color: '#6b7280', marginTop: 3 },
  qtyInput:           { width: 60, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingVertical: 8, textAlign: 'center', fontSize: 16, color: '#111827', backgroundColor: '#f9fafb' },
  footer:             { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  confirmBtn:         { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText:     { color: '#fff', fontSize: 16, fontWeight: '600' },
})
