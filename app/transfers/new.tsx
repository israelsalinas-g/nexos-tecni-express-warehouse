import { useState } from 'react'
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator 
} from 'react-native'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { router } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { FormInput } from '@/components/common/FormInput'
import { FormScannerInput } from '@/components/common/FormScannerInput'
import { CreateTransferUseCase } from '@/core/use-cases/create-transfer.use-case'

const transferSchema = z.object({
  fromWarehouseId: z.string().min(1, 'Selecciona bodega de origen'),
  toWarehouseId:   z.string().min(1, 'Selecciona bodega de destino'),
  sku:             z.string().optional(),
  quantity:        z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Cantidad inválida',
  }),
})

type TransferForm = z.infer<typeof transferSchema>

export default function NewTransferScreen() {
  const [items, setItems] = useState<{ productId: string, sku: string, quantity: number }[]>([])
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, resetField, watch } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromWarehouseId: 'default-origin', // In real app, from user context
      toWarehouseId:   '',
      quantity:        '1',
    }
  })

  const addItem = (data: TransferForm) => {
    // In a real app, we'd lookup the productId by SKU using ProductService
    // For now, let's simulate adding an item
    const newItem = {
      productId: 'temp-id-' + Math.random(),
      sku:       data.sku || 'Manual',
      quantity:  Number(data.quantity)
    }
    setItems([...items, newItem])
    resetField('sku')
    resetField('quantity', { defaultValue: '1' })
  }

  const handleCreate = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Agrega al menos un producto.')
      return
    }

    setLoading(true)
    try {
      const useCase = new CreateTransferUseCase()
      // Note: In real app, get fromWarehouseId and toWarehouseId from form state
      await useCase.execute({
        fromWarehouseId: 'origin-id',
        toWarehouseId:   'dest-id',
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        createdBy: 'user-id'
      })
      Alert.alert('Éxito', 'Traslado creado correctamente.')
      router.back()
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Configuración de Traslado</Text>
      <View style={styles.card}>
        <FormInput 
          name="fromWarehouseId" 
          control={control} 
          label="Bodega Origen" 
          placeholder="Seleccionar..." 
        />
        <FormInput 
          name="toWarehouseId" 
          control={control} 
          label="Bodega Destino" 
          placeholder="Seleccionar..." 
        />
      </View>

      <Text style={styles.sectionTitle}>Agregar Productos</Text>
      <View style={styles.card}>
        <FormScannerInput 
          name="sku" 
          control={control} 
          label="Escanear Producto" 
        />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <FormInput 
              name="quantity" 
              control={control} 
              label="Cantidad" 
              keyboardType="numeric" 
            />
          </View>
          <TouchableOpacity 
            style={styles.addBtn} 
            onPress={handleSubmit(addItem)}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            <Text style={styles.addBtnText}>Agregar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Lista de Ítems ({items.length})</Text>
      {items.map((item, idx) => (
        <View key={idx} style={styles.itemRow}>
          <View>
            <Text style={styles.itemSku}>{item.sku}</Text>
            <Text style={styles.itemQty}>Cantidad: {item.quantity}</Text>
          </View>
          <TouchableOpacity onPress={() => setItems(items.filter((_, i) => i !== idx))}>
            <MaterialCommunityIcons name="delete-outline" size={22} color="#dc2626" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity 
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Crear Traslado</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  addBtn: { 
    backgroundColor: '#374151', 
    height: 48, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    marginBottom: 16
  },
  addBtnText: { color: '#fff', fontWeight: '600', marginLeft: 4 },
  itemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 8 
  },
  itemSku: { fontSize: 15, fontWeight: '600', color: '#111827' },
  itemQty: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  submitBtn: { backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
