import { useState, useEffect } from 'react'
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Modal, FlatList,
  KeyboardAvoidingView, Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { WarehouseService } from '@/services/warehouse.service'
import { CreateTransferUseCase } from '@/core/use-cases/create-transfer.use-case'
import { Warehouse } from '@/types/database.types'

interface SelectorItem {
  id: string
  name: string
}

export default function NewTransferScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  
  // Selection State
  const [originWarehouse, setOriginWarehouse] = useState<Warehouse | null>(null)
  const [destWarehouse, setDestWarehouse] = useState<Warehouse | null>(null)
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [activeSelector, setActiveSelector] = useState<'origin' | 'dest' | null>(null)

  // Items State (Placeholder for product selection)
  const [items, setItems] = useState<{ productId: string, sku: string, quantity: number }[]>([])

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    try {
      const data = await WarehouseService.getAll()
      setWarehouses(data.filter(w => w.is_active))
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las bodegas.')
    } finally {
      setFetching(false)
    }
  }

  const openSelector = (type: 'origin' | 'dest') => {
    setActiveSelector(type)
    setModalTitle(type === 'origin' ? 'Bodega de Origen' : 'Bodega de Destino')
    setModalVisible(true)
  }

  const handleSelect = (warehouse: Warehouse) => {
    if (activeSelector === 'origin') {
      if (destWarehouse?.id === warehouse.id) {
        Alert.alert('Aviso', 'La bodega de origen debe ser diferente a la de destino.')
        return
      }
      setOriginWarehouse(warehouse)
    } else {
      if (originWarehouse?.id === warehouse.id) {
        Alert.alert('Aviso', 'La bodega de destino debe ser diferente a la de origen.')
        return
      }
      setDestWarehouse(warehouse)
    }
    setModalVisible(false)
  }

  const handleCreate = async () => {
    if (!originWarehouse || !destWarehouse) {
      Alert.alert('Error', 'Debes seleccionar ambas bodegas.')
      return
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Agrega al menos un producto al traslado.')
      return
    }

    setLoading(true)
    try {
      const useCase = new CreateTransferUseCase()
      await useCase.execute({
        fromWarehouseId: originWarehouse.id,
        toWarehouseId: destWarehouse.id,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        createdBy: 'user-id' // Should be real user ID
      })
      Alert.alert('Éxito', 'Traslado registrado correctamente.', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.title}>Nuevo Traslado</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Configuración de Ruta</Text>
        
        <View style={styles.routeCard}>
          {/* Origin Selector */}
          <TouchableOpacity 
            style={styles.selector} 
            onPress={() => openSelector('origin')}
          >
            <View style={styles.selectorIcon}>
              <MaterialCommunityIcons name="export" size={20} color={tokens.colors.primary} />
            </View>
            <View style={styles.selectorInfo}>
              <Text style={styles.label}>Bodega de Origen (Salida)</Text>
              <Text style={[styles.value, !originWarehouse && styles.placeholder]}>
                {originWarehouse ? originWarehouse.name : 'Seleccionar origen...'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color={tokens.colors.gray400} />
          </TouchableOpacity>

          <View style={styles.routeDivider}>
            <View style={styles.line} />
            <MaterialCommunityIcons name="swap-vertical" size={20} color={tokens.colors.gray200} />
            <View style={styles.line} />
          </View>

          {/* Destination Selector */}
          <TouchableOpacity 
            style={styles.selector} 
            onPress={() => openSelector('dest')}
          >
            <View style={[styles.selectorIcon, { backgroundColor: tokens.colors.success + '10' }]}>
              <MaterialCommunityIcons name="import" size={20} color={tokens.colors.success} />
            </View>
            <View style={styles.selectorInfo}>
              <Text style={styles.label}>Bodega de Destino (Entrada)</Text>
              <Text style={[styles.value, !destWarehouse && styles.placeholder]}>
                {destWarehouse ? destWarehouse.name : 'Seleccionar destino...'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color={tokens.colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Product Section Placeholder */}
        <Text style={styles.sectionLabel}>Productos en el Traslado</Text>
        <TouchableOpacity style={styles.addItemBtn} onPress={() => Alert.alert('Info', 'Funcionalidad de escaneo disponible próximamente.')}>
          <MaterialCommunityIcons name="barcode-scan" size={24} color={tokens.colors.primary} />
          <Text style={styles.addItemBtnText}>Escanear o Buscar Producto</Text>
        </TouchableOpacity>

        <View style={styles.emptyItems}>
          <MaterialCommunityIcons name="package-variant" size={48} color={tokens.colors.gray100} />
          <Text style={styles.emptyItemsText}>Agrega productos para iniciar el traslado</Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, (!originWarehouse || !destWarehouse) && styles.btnDisabled]} 
          onPress={handleCreate}
          disabled={loading || !originWarehouse || !destWarehouse}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirmar Traslado</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray400} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={warehouses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.modalItem,
                    (activeSelector === 'origin' ? originWarehouse?.id : destWarehouse?.id) === item.id && styles.modalItemActive
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.modalItemRow}>
                    <MaterialCommunityIcons name="warehouse" size={20} color={tokens.colors.gray400} />
                    <Text style={styles.modalItemText}>{item.name}</Text>
                  </View>
                  {(activeSelector === 'origin' ? originWarehouse?.id : destWarehouse?.id) === item.id && (
                    <MaterialCommunityIcons name="check" size={20} color={tokens.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100
  },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: tokens.colors.gray900 },
  content: { padding: 20 },
  sectionLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: tokens.colors.gray400, 
    textTransform: 'uppercase', 
    marginBottom: 12,
    letterSpacing: 1
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    ...tokens.shadow.md,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  selectorIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: tokens.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  label: { fontSize: 11, color: tokens.colors.gray400, marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '700', color: tokens.colors.gray900 },
  placeholder: { color: tokens.colors.gray400, fontWeight: '400' },

  routeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 22,
    marginVertical: 4,
  },
  line: { width: 1, height: 15, backgroundColor: tokens.colors.gray50, marginHorizontal: 20 },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.primary + '20',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  addItemBtnText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  emptyItems: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: tokens.colors.gray50,
    borderRadius: 24,
    marginBottom: 32,
  },
  emptyItemsText: {
    marginTop: 16,
    fontSize: 13,
    color: tokens.colors.gray400,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: tokens.colors.primary,
    borderRadius: 18,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...tokens.shadow.md,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    maxHeight: '80%',
    ...tokens.shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: tokens.colors.gray900 },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  modalItemActive: { backgroundColor: tokens.colors.primary + '05' },
  modalItemRow: { flexDirection: 'row', alignItems: 'center' },
  modalItemText: { marginLeft: 12, fontSize: 16, color: tokens.colors.gray600 },

})
