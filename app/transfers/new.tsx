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
import { tokens } from '@/theme/tokens'

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

  const { control, handleSubmit, resetField } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromWarehouseId: 'default-origin',
      toWarehouseId:   '',
      quantity:        '1',
    }
  })

  const addItem = (data: TransferForm) => {
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
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
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
            accessible
            accessibilityRole="button"
            accessibilityLabel="Agregar producto a la lista"
          >
            <MaterialCommunityIcons name="plus" size={24} color={tokens.colors.bgLight} />
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
            <MaterialCommunityIcons name="delete-outline" size={22} color={tokens.colors.error} />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity 
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
        onPress={handleCreate}
        disabled={loading}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Confirmar y crear traslado"
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Crear Traslado</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  content: { padding: tokens.spacing[4], paddingBottom: tokens.spacing[10] },
  sectionTitle: { 
    fontSize: tokens.typography.size.xs, 
    fontWeight: tokens.typography.weight.bold, 
    color: tokens.colors.gray400, 
    textTransform: 'uppercase', 
    letterSpacing: 1,
    marginBottom: tokens.spacing[2], 
    marginTop: tokens.spacing[4] 
  },
  card: { 
    backgroundColor: tokens.colors.bgLight, 
    borderRadius: tokens.radius.xl, 
    padding: tokens.spacing[4], 
    marginBottom: tokens.spacing[2],
    ...tokens.shadow.sm,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: tokens.spacing[3] },
  addBtn: { 
    backgroundColor: tokens.colors.secondary, 
    height: 52, 
    borderRadius: tokens.radius.lg, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: tokens.spacing[4],
    marginBottom: tokens.spacing[4]
  },
  addBtnText: { color: tokens.colors.bgLight, fontWeight: tokens.typography.weight.semibold, marginLeft: tokens.spacing[1] },
  itemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: tokens.colors.bgLight, 
    padding: tokens.spacing[3], 
    borderRadius: tokens.radius.lg, 
    marginBottom: tokens.spacing[2],
    ...tokens.shadow.sm,
  },
  itemSku: { fontSize: tokens.typography.size.base, fontWeight: tokens.typography.weight.semibold, color: tokens.colors.gray900 },
  itemQty: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 2 },
  submitBtn: { 
    backgroundColor: tokens.colors.primary, 
    borderRadius: tokens.radius.xl, 
    paddingVertical: tokens.spacing[4], 
    alignItems: 'center', 
    marginTop: tokens.spacing[8] 
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: tokens.colors.bgLight, fontSize: tokens.typography.size.base, fontWeight: tokens.typography.weight.bold },
})

