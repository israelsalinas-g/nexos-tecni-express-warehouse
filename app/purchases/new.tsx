import { useState, useEffect } from 'react'
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Modal, FlatList,
  SafeAreaView, KeyboardAvoidingView, Platform, TextInput,
  Image
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { SupplierService } from '@/services/supplier.service'
import { WarehouseService } from '@/services/warehouse.service'
import { ProductService } from '@/services/product.service'
import { PurchaseOrderService } from '@/services/purchase-order.service'
import { Supplier, Warehouse, Product } from '@/types/database.types'

export default function NewPurchaseOrderScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  
  // Master Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  
  // Form State
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [items, setItems] = useState<{ product: Product, quantity: number, price: number }[]>([])
  
  // Modal State
  const [modalType, setModalType] = useState<'supplier' | 'warehouse' | 'product' | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [s, w] = await Promise.all([
        SupplierService.getAll(),
        WarehouseService.getAll()
      ])
      setSuppliers(s.filter(i => i.is_active))
      setWarehouses(w.filter(i => i.is_active))
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos iniciales.')
    } finally {
      setFetching(false)
    }
  }

  const searchProducts = async (term: string) => {
    setSearchTerm(term)
    if (term.length < 2) {
      setSearchResults([])
      return
    }
    try {
      const data = await ProductService.search(term)
      setSearchResults(data)
    } catch (error) {
      console.error(error)
    }
  }

  const addItem = (product: Product) => {
    const existing = items.find(i => i.product.id === product.id)
    if (existing) {
      Alert.alert('Aviso', 'Este producto ya está en la lista.')
      return
    }
    setItems([...items, { product, quantity: 1, price: product.price_public || 0 }])
    setModalType(null)
    setSearchTerm('')
    setSearchResults([])
  }

  const updateItem = (index: number, field: 'quantity' | 'price', value: string) => {
    const newItems = [...items]
    const val = parseFloat(value) || 0
    newItems[index] = { ...newItems[index], [field]: val }
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return items.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0)
  }

  const handleSave = async () => {
    if (!selectedSupplier || !selectedWarehouse || items.length === 0) {
      Alert.alert('Error', 'Completa el proveedor, bodega y agrega al menos un producto.')
      return
    }

    setLoading(true)
    try {
      const po_number = `PO-${Date.now().toString().slice(-6)}`
      await PurchaseOrderService.create({
        po_number,
        supplier_id: selectedSupplier.id,
        warehouse_id: selectedWarehouse.id,
        status: 'pending',
        total_amount: calculateTotal(),
        created_by: '00000000-0000-0000-0000-000000000000' // Placeholder
      }, items.map(i => ({
        product_id: i.product.id,
        quantity_ordered: i.quantity,
        unit_price: i.price
      })))

      Alert.alert('Éxito', 'Orden de compra creada correctamente.', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la orden.')
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva Orden de Compra</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color={tokens.colors.primary} /> : 
              <Text style={[styles.saveBtn, items.length === 0 && { opacity: 0.5 }]}>Guardar</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Main Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información General</Text>
            
            <TouchableOpacity style={styles.selector} onPress={() => setModalType('supplier')}>
              <View style={[styles.selectorIcon, { backgroundColor: tokens.colors.success + '15' }]}>
                <MaterialCommunityIcons name="truck-delivery-outline" size={20} color={tokens.colors.success} />
              </View>
              <View style={styles.selectorText}>
                <Text style={styles.selectorLabel}>Proveedor</Text>
                <Text style={[styles.selectorValue, !selectedSupplier && styles.placeholder]}>
                  {selectedSupplier ? selectedSupplier.name : 'Seleccionar proveedor...'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={20} color={tokens.colors.gray400} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.selector} onPress={() => setModalType('warehouse')}>
              <View style={[styles.selectorIcon, { backgroundColor: tokens.colors.primary + '15' }]}>
                <MaterialCommunityIcons name="warehouse" size={20} color={tokens.colors.primary} />
              </View>
              <View style={styles.selectorText}>
                <Text style={styles.selectorLabel}>Bodega de Destino</Text>
                <Text style={[styles.selectorValue, !selectedWarehouse && styles.placeholder]}>
                  {selectedWarehouse ? selectedWarehouse.name : 'Seleccionar bodega...'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={20} color={tokens.colors.gray400} />
            </TouchableOpacity>
          </View>

          {/* Items Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Productos</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => setModalType('product')}>
                <MaterialCommunityIcons name="plus" size={20} color={tokens.colors.primary} />
                <Text style={styles.addBtnText}>Agregar</Text>
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyItems}>
                <MaterialCommunityIcons name="cart-plus" size={48} color={tokens.colors.gray100} />
                <Text style={styles.emptyItemsText}>No has agregado productos aún</Text>
              </View>
            ) : (
              items.map((item, index) => (
                <View key={item.product.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.productThumbContainer}>
                      {item.product.product_images?.[0]?.url ? (
                        <Image source={{ uri: item.product.product_images[0].url }} style={styles.productThumb} />
                      ) : (
                        <View style={styles.productThumbPlaceholder}>
                          <MaterialCommunityIcons name="image-outline" size={20} color={tokens.colors.gray400} />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.itemName}>{item.product.name_es}</Text>
                      <Text style={styles.itemSku}>{item.product.sku}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeItem(index)}>
                      <MaterialCommunityIcons name="delete-outline" size={20} color={tokens.colors.error} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.itemInputs}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Cantidad</Text>
                      <TextInput 
                        style={styles.input}
                        keyboardType="numeric"
                        value={item.quantity.toString()}
                        onChangeText={(v) => updateItem(index, 'quantity', v)}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Precio Unit.</Text>
                      <TextInput 
                        style={styles.input}
                        keyboardType="numeric"
                        value={item.price.toString()}
                        onChangeText={(v) => updateItem(index, 'price', v)}
                      />
                    </View>
                    <View style={styles.itemSubtotal}>
                      <Text style={styles.inputLabel}>Subtotal</Text>
                      <Text style={styles.subtotalValue}>L. {(item.quantity * item.price).toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Summary */}
          {items.length > 0 && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total OC</Text>
                <Text style={styles.totalAmount}>L. {calculateTotal().toFixed(2)}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Selection Modals */}
        <Modal visible={!!modalType} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {modalType === 'supplier' ? 'Seleccionar Proveedor' : 
                   modalType === 'warehouse' ? 'Seleccionar Bodega' : 'Buscar Producto'}
                </Text>
                <TouchableOpacity onPress={() => { setModalType(null); setSearchTerm(''); setSearchResults([]); }}>
                  <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray400} />
                </TouchableOpacity>
              </View>

              {modalType === 'product' && (
                <View style={styles.searchBox}>
                  <MaterialCommunityIcons name="magnify" size={20} color={tokens.colors.gray400} />
                  <TextInput 
                    style={styles.searchInput}
                    placeholder="Escribe nombre o SKU..."
                    value={searchTerm}
                    onChangeText={searchProducts}
                    autoFocus
                  />
                </View>
              )}

              <FlatList 
                data={modalType === 'supplier' ? suppliers : modalType === 'warehouse' ? warehouses : searchResults}
                keyExtractor={item => item.id}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity 
                    style={styles.modalItem}
                    onPress={() => {
                      if (modalType === 'supplier') setSelectedSupplier(item)
                      else if (modalType === 'warehouse') setSelectedWarehouse(item)
                      else addItem(item)
                      if (modalType !== 'product') setModalType(null)
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {modalType === 'product' && (
                        <View style={[styles.productThumbContainer, { marginRight: 12 }]}>
                          {item.product_images?.[0]?.url ? (
                            <Image source={{ uri: item.product_images[0].url }} style={styles.productThumb} />
                          ) : (
                            <View style={styles.productThumbPlaceholder}>
                              <MaterialCommunityIcons name="image-outline" size={20} color={tokens.colors.gray400} />
                            </View>
                          )}
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalItemTitle}>{item.name || item.name_es}</Text>
                        <Text style={styles.modalItemSub}>
                          {modalType === 'product' ? item.sku : 
                           modalType === 'supplier' ? item.city || 'N/A' : item.code}
                        </Text>
                      </View>
                    </View>

                    <MaterialCommunityIcons name="chevron-right" size={20} color={tokens.colors.gray200} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  modalType === 'product' && searchTerm.length > 1 ? (
                    <Text style={styles.noResults}>No se encontraron productos</Text>
                  ) : null
                }
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: tokens.colors.gray900 },
  backButton: { padding: 4 },
  saveBtn: { fontSize: 16, fontWeight: '700', color: tokens.colors.primary },
  content: { flex: 1, backgroundColor: tokens.colors.bgScreen, padding: 16 },
  section: { marginBottom: 24 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: tokens.colors.gray400, 
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    ...tokens.shadow.sm,
  },
  selectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorText: { flex: 1, marginLeft: 12 },
  selectorLabel: { fontSize: 11, color: tokens.colors.gray400, marginBottom: 2 },
  selectorValue: { fontSize: 14, fontWeight: '700', color: tokens.colors.gray800 },
  placeholder: { color: tokens.colors.gray200, fontWeight: '400' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.primary,
    marginLeft: 4,
  },
  emptyItems: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
    borderStyle: 'dashed',
  },
  emptyItemsText: {
    marginTop: 12,
    fontSize: 14,
    color: tokens.colors.gray400,

  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    ...tokens.shadow.sm,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  itemName: { fontSize: 15, fontWeight: '700', color: tokens.colors.gray900 },
  itemSku: { fontSize: 12, color: tokens.colors.gray400, marginTop: 2 },
  itemInputs: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 11, color: tokens.colors.gray400, marginBottom: 6 },
  input: {
    backgroundColor: tokens.colors.gray50,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.gray900,
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
  },
  itemSubtotal: { minWidth: 80, alignItems: 'flex-end' },
  subtotalValue: { fontSize: 15, fontWeight: '800', color: tokens.colors.gray900 },
  summaryCard: {
    backgroundColor: tokens.colors.primary,
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    ...tokens.shadow.md,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  totalAmount: { fontSize: 24, fontWeight: '800', color: '#fff' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24, 
    height: '80%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: tokens.colors.gray900 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.gray50,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 10, fontSize: 16 },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray50,
  },
  modalItemTitle: { fontSize: 16, fontWeight: '600', color: tokens.colors.gray900 },
  modalItemSub: { fontSize: 12, color: tokens.colors.gray400, marginTop: 2 },
  noResults: { textAlign: 'center', marginTop: 40, color: tokens.colors.gray400 },
  productThumbContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: tokens.colors.gray50,
  },
  productThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productThumbPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
    borderRadius: 8,
  },
})
