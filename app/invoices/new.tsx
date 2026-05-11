import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Modal, FlatList,
  SafeAreaView, KeyboardAvoidingView, Platform, TextInput,
  Image,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { ProfileService } from '@/services/profile.service'
import { ProductService } from '@/services/product.service'
import { InvoiceService } from '@/services/invoice.service'
import { FiscalService } from '@/services/fiscal.service'
import { supabase } from '@/lib/supabase'
import { Profile, Product, InvoiceAuthRange } from '@/types/database.types'

const TAX_RATE = 0.15

export default function NewInvoiceScreen() {
  const router = useRouter()
  const { fromOrderId } = useLocalSearchParams<{ fromOrderId?: string }>()

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const [authRange, setAuthRange] = useState<InvoiceAuthRange | null>(null)
  const [customers, setCustomers] = useState<Profile[]>([])

  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null)
  const [items, setItems] = useState<{ product: Product; quantity: number; price: number }[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'card' | 'cash'>('transfer')
  const [notes, setNotes] = useState('')
  const [sourceOrderId, setSourceOrderId] = useState<string | null>(null)

  const [modalType, setModalType] = useState<'customer' | 'product' | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [customersData, range] = await Promise.all([
        ProfileService.getAll(),
        FiscalService.getActiveRange(),
      ])
      setCustomers(customersData)
      setAuthRange(range)

      if (fromOrderId) {
        await prefillFromOrder(fromOrderId, customersData)
      }
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los datos.')
    } finally {
      setFetching(false)
    }
  }

  const prefillFromOrder = async (orderId: string, customersList: Profile[]) => {
    const { data: order } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*, product_images(*)))')
      .eq('id', orderId)
      .single()

    if (!order) return

    const customer = customersList.find(c => c.id === order.customer_id)
    if (customer) setSelectedCustomer(customer)
    if (order.payment_method) setPaymentMethod(order.payment_method as any)
    if (order.notes) setNotes(order.notes)

    if (order.order_items) {
      setItems(
        order.order_items
          .map((oi: any) => ({ product: oi.products as Product, quantity: oi.quantity, price: oi.unit_price }))
          .filter((i: any) => i.product)
      )
    }

    setSourceOrderId(orderId)
  }

  const searchProducts = async (term: string) => {
    setSearchTerm(term)
    if (term.length < 2) { setSearchResults([]); return }
    try {
      setSearchResults(await ProductService.search(term))
    } catch {
      // silent
    }
  }

  const addItem = (product: Product) => {
    if (items.find(i => i.product.id === product.id)) {
      Alert.alert('Aviso', 'Este producto ya está en la lista.')
      return
    }
    setItems([...items, { product, quantity: 1, price: product.price_public || 0 }])
    setModalType(null)
    setSearchTerm('')
    setSearchResults([])
  }

  const updateItem = (index: number, field: 'quantity' | 'price', value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 }
    setItems(updated)
  }

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const subtotal = () => items.reduce((acc, i) => acc + i.quantity * i.price, 0)
  const taxAmount = () => subtotal() * TAX_RATE
  const total = () => subtotal() + taxAmount()

  const handleEmit = async () => {
    if (!selectedCustomer) { Alert.alert('Error', 'Selecciona un cliente.'); return }
    if (items.length === 0) { Alert.alert('Error', 'Agrega al menos un producto.'); return }
    if (!authRange) { Alert.alert('Error', 'No hay rango de facturación activo.'); return }

    setLoading(true)
    try {
      let invoiceNumber: string

      if (sourceOrderId) {
        const result = await InvoiceService.createFromOrder(sourceOrderId, paymentMethod)
        invoiceNumber = result.invoiceNumber
      } else {
        const result = await InvoiceService.createDirect(
          {
            customer_id: selectedCustomer.id,
            subtotal: subtotal(),
            tax_amount: taxAmount(),
            total: total(),
            payment_method: paymentMethod,
            notes: notes || undefined,
          },
          items.map(i => ({
            product_id: i.product.id,
            product_name_es: i.product.name_es,
            product_sku: i.product.sku,
            quantity: i.quantity,
            unit_price: i.price,
            subtotal: i.quantity * i.price,
          }))
        )
        invoiceNumber = result.invoiceNumber
      }

      Alert.alert('Factura Emitida', `Factura ${invoiceNumber} generada exitosamente.`, [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (error: any) {
      Alert.alert('Error al emitir', error.message || 'No se pudo generar la factura.')
    } finally {
      setLoading(false)
    }
  }

  const invoicePreview = authRange ? InvoiceService.formatInvoiceNumber(authRange) : '—'
  const remaining = authRange ? authRange.end_number - authRange.current_number : 0
  const isReadonly = !!sourceOrderId

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

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {sourceOrderId ? 'Facturar Orden' : 'Nueva Factura'}
          </Text>
          <TouchableOpacity onPress={handleEmit} disabled={loading || !authRange}>
            {loading
              ? <ActivityIndicator size="small" color={tokens.colors.primary} />
              : <Text style={[styles.emitBtn, (!authRange || items.length === 0) && { opacity: 0.4 }]}>Emitir</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Auth Range Banner */}
          {authRange ? (
            <View style={[styles.rangeBanner, remaining <= authRange.alert_threshold && styles.rangeBannerWarn]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rangeLabel}>RANGO ACTIVO · CAI</Text>
                <Text style={styles.caiText} numberOfLines={1} ellipsizeMode="middle">{authRange.cai}</Text>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Próxima factura: </Text>
                  <Text style={styles.previewNumber}>{invoicePreview}</Text>
                </View>
              </View>
              <View style={styles.remainingBox}>
                <Text style={[styles.remainingCount, remaining <= authRange.alert_threshold && { color: tokens.colors.warning }]}>
                  {remaining}
                </Text>
                <Text style={styles.remainingLabel}>disponibles</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noRangeBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color={tokens.colors.error} />
              <Text style={styles.noRangeText}>Sin rango autorizado activo. No se pueden emitir facturas.</Text>
            </View>
          )}

          {/* Cliente */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <TouchableOpacity style={styles.selector} onPress={() => setModalType('customer')}>
              <View style={[styles.selectorIcon, { backgroundColor: tokens.colors.info + '15' }]}>
                <MaterialCommunityIcons name="account-outline" size={20} color={tokens.colors.info} />
              </View>
              <View style={styles.selectorText}>
                <Text style={[styles.selectorValue, !selectedCustomer && styles.placeholder]}>
                  {selectedCustomer ? selectedCustomer.full_name : 'Seleccionar cliente...'}
                </Text>
                {selectedCustomer && <Text style={styles.selectorSub}>{selectedCustomer.email}</Text>}
              </View>
              <MaterialCommunityIcons name="chevron-down" size={20} color={tokens.colors.gray400} />
            </TouchableOpacity>
          </View>

          {/* Productos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Productos / Servicios</Text>
              {!isReadonly && (
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalType('product')}>
                  <MaterialCommunityIcons name="plus" size={20} color={tokens.colors.primary} />
                  <Text style={styles.addBtnText}>Agregar</Text>
                </TouchableOpacity>
              )}
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyItems}>
                <MaterialCommunityIcons name="receipt-outline" size={48} color={tokens.colors.gray100} />
                <Text style={styles.emptyItemsText}>Sin productos en la factura</Text>
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
                    {!isReadonly && (
                      <TouchableOpacity onPress={() => removeItem(index)}>
                        <MaterialCommunityIcons name="delete-outline" size={20} color={tokens.colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.itemInputs}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Cant.</Text>
                      <TextInput
                        style={[styles.input, isReadonly && styles.inputReadonly]}
                        keyboardType="numeric"
                        value={item.quantity.toString()}
                        onChangeText={v => !isReadonly && updateItem(index, 'quantity', v)}
                        editable={!isReadonly}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Precio (s/imp)</Text>
                      <TextInput
                        style={[styles.input, isReadonly && styles.inputReadonly]}
                        keyboardType="numeric"
                        value={item.price.toString()}
                        onChangeText={v => !isReadonly && updateItem(index, 'price', v)}
                        editable={!isReadonly}
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

          {/* Método de Pago */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Método de Pago</Text>
            <View style={styles.paymentMethods}>
              {[
                { id: 'transfer', label: 'Transferencia', icon: 'bank-transfer' },
                { id: 'card', label: 'Tarjeta', icon: 'credit-card-outline' },
                { id: 'cash', label: 'Efectivo', icon: 'cash' },
              ].map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.paymentBtn, paymentMethod === m.id && styles.paymentBtnActive]}
                  onPress={() => setPaymentMethod(m.id as any)}
                >
                  <MaterialCommunityIcons
                    name={m.icon as any}
                    size={24}
                    color={paymentMethod === m.id ? tokens.colors.primary : tokens.colors.gray400}
                  />
                  <Text style={[styles.paymentLabel, paymentMethod === m.id && styles.paymentLabelActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notas (solo en factura nueva, no desde orden) */}
          {!isReadonly && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notas (opcional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Observaciones o notas adicionales..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Resumen */}
          {items.length > 0 && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal (sin impuesto)</Text>
                <Text style={styles.summaryValue}>L. {subtotal().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ISV (15%)</Text>
                <Text style={styles.summaryValue}>L. {taxAmount().toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>TOTAL A FACTURAR</Text>
                <Text style={styles.totalValue}>L. {total().toFixed(2)}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Modales de selección */}
        <Modal visible={!!modalType} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {modalType === 'customer' ? 'Seleccionar Cliente' : 'Buscar Producto'}
                </Text>
                <TouchableOpacity onPress={() => { setModalType(null); setSearchTerm(''); setSearchResults([]) }}>
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
                data={modalType === 'customer' ? customers : searchResults}
                keyExtractor={item => item.id}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      if (modalType === 'customer') { setSelectedCustomer(item); setModalType(null) }
                      else addItem(item)
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
                        <Text style={styles.modalItemTitle}>{item.full_name || item.name_es}</Text>
                        <Text style={styles.modalItemSub}>{modalType === 'product' ? item.sku : item.email}</Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={tokens.colors.gray200} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  modalType === 'product' && searchTerm.length > 1
                    ? <Text style={styles.noResults}>No se encontraron productos</Text>
                    : null
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
  emitBtn: { fontSize: 16, fontWeight: '700', color: tokens.colors.primary },
  content: { flex: 1, backgroundColor: tokens.colors.bgScreen, padding: 16 },

  // Auth Range Banner
  rangeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primary + '0d',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: tokens.colors.primary + '30',
  },
  rangeBannerWarn: {
    backgroundColor: tokens.colors.warning + '15',
    borderColor: tokens.colors.warning + '50',
  },
  rangeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: tokens.colors.gray400,
    letterSpacing: 1,
    marginBottom: 4,
  },
  caiText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.gray600,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 6,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center' },
  previewLabel: { fontSize: 12, color: tokens.colors.gray400 },
  previewNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: tokens.colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  remainingBox: { alignItems: 'center', marginLeft: 12 },
  remainingCount: { fontSize: 28, fontWeight: '900', color: tokens.colors.primary },
  remainingLabel: { fontSize: 10, color: tokens.colors.gray400, fontWeight: '600' },
  noRangeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: tokens.colors.error + '10',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: tokens.colors.error + '30',
  },
  noRangeText: { fontSize: 13, color: tokens.colors.error, fontWeight: '600', flex: 1 },

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
  selectorValue: { fontSize: 14, fontWeight: '700', color: tokens.colors.gray800 },
  selectorSub: { fontSize: 12, color: tokens.colors.gray400, marginTop: 2 },
  placeholder: { color: tokens.colors.gray200, fontWeight: '400' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: tokens.colors.primary, marginLeft: 4 },
  emptyItems: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
    borderStyle: 'dashed',
  },
  emptyItemsText: { marginTop: 12, fontSize: 14, color: tokens.colors.gray400 },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    ...tokens.shadow.sm,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  itemName: { fontSize: 15, fontWeight: '700', color: tokens.colors.gray900 },
  itemSku: { fontSize: 12, color: tokens.colors.gray400, marginTop: 2 },
  itemInputs: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  inputGroup: { flex: 1 },
  inputLabel: {
    fontSize: 10,
    color: tokens.colors.gray400,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: tokens.colors.gray50,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.gray900,
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
  },
  inputReadonly: {
    backgroundColor: tokens.colors.gray100,
    color: tokens.colors.gray600,
  },
  itemSubtotal: { minWidth: 80, alignItems: 'flex-end' },
  subtotalValue: { fontSize: 15, fontWeight: '800', color: tokens.colors.gray900 },
  productThumbContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: tokens.colors.gray50,
  },
  productThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  productThumbPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
  },
  paymentMethods: { flexDirection: 'row', gap: 12, marginTop: 8 },
  paymentBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
  },
  paymentBtnActive: {
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.primary + '05',
  },
  paymentLabel: { marginTop: 8, fontSize: 12, color: tokens.colors.gray400, fontWeight: '600' },
  paymentLabelActive: { color: tokens.colors.primary },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    color: tokens.colors.gray800,
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
    minHeight: 88,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginTop: 10,
    ...tokens.shadow.lg,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: tokens.colors.gray400 },
  summaryValue: { fontSize: 14, fontWeight: '600', color: tokens.colors.gray800 },
  totalRow: { borderTopWidth: 1, borderTopColor: tokens.colors.gray100, paddingTop: 16, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: tokens.colors.gray900 },
  totalValue: { fontSize: 24, fontWeight: '900', color: tokens.colors.primary },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: '80%',
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
})
