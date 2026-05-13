import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  TextInput, Modal, FlatList,
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { QuotationService } from '@/services/quotation.service'
import { ProfileService } from '@/services/profile.service'
import { ProductService } from '@/services/product.service'
import { DatePickerInput } from '@/components/common/DatePickerInput'
import { tokens } from '@/theme/tokens'
import { Profile, Product } from '@/types/database.types'

const TAX_RATE = 0.15

interface LineItem {
  key: string
  product_id?: string
  product_name_es: string
  product_sku?: string
  quantity: number
  unit_price: number
}

export default function NewQuotationScreen() {
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [customers, setCustomers] = useState<Profile[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null)
  const [items, setItems] = useState<LineItem[]>([])
  const [validUntil, setValidUntil] = useState<Date | null>(null)
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState('')

  const [modalType, setModalType] = useState<'customer' | 'product' | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])

  useEffect(() => {
    ProfileService.getAll()
      .then(setCustomers)
      .catch(() => Alert.alert('Error', 'No se pudieron cargar los clientes.'))
      .finally(() => setFetching(false))
  }, [])

  useEffect(() => {
    if (modalType !== 'product') return
    if (searchTerm.length < 1) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const results = await ProductService.search(searchTerm)
        setSearchResults(results)
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, modalType])

  const filteredCustomers = customers.filter(c =>
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const addItem = (product: Product) => {
    setItems(prev => [...prev, {
      key: `${product.id}-${Date.now()}`,
      product_id: product.id,
      product_name_es: product.name_es,
      product_sku: product.sku,
      quantity: 1,
      unit_price: product.price_public,
    }])
    setModalType(null)
    setSearchTerm('')
  }

  const updateItem = (key: string, field: 'quantity' | 'unit_price', value: string) => {
    const num = parseFloat(value) || 0
    setItems(prev => prev.map(i => i.key === key ? { ...i, [field]: num } : i))
  }

  const removeItem = (key: string) => {
    setItems(prev => prev.filter(i => i.key !== key))
  }

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
  const discountAmt = parseFloat(discount) || 0
  const taxAmount = Math.round((subtotal - discountAmt) * TAX_RATE * 100) / 100
  const total = subtotal - discountAmt + taxAmount

  const handleSave = async () => {
    if (!selectedCustomer) { Alert.alert('Error', 'Selecciona un cliente.'); return }
    if (items.length === 0) { Alert.alert('Error', 'Agrega al menos un artículo.'); return }
    if (items.some(i => i.quantity <= 0 || i.unit_price <= 0)) {
      Alert.alert('Error', 'Todos los artículos deben tener cantidad y precio válidos.')
      return
    }

    setSaving(true)
    try {
      await QuotationService.create({
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.full_name,
        customer_email: selectedCustomer.email,
        valid_until: validUntil ? validUntil.toISOString() : undefined,
        notes: notes.trim() || undefined,
        discount: discountAmt || undefined,
        items: items.map(i => ({
          product_id: i.product_id,
          product_name_es: i.product_name_es,
          product_sku: i.product_sku,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      })
      Alert.alert('Cotización creada', 'Se guardó como borrador.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch {
      Alert.alert('Error', 'No se pudo crear la cotización.')
    } finally {
      setSaving(false)
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerClose}>
            <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva Cotización</Text>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.saveBtnText}>Guardar</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Customer selector */}
          <Text style={styles.sectionLabel}>Cliente *</Text>
          <TouchableOpacity
            style={styles.selectorBtn}
            onPress={() => { setModalType('customer'); setSearchTerm('') }}
          >
            {selectedCustomer ? (
              <View style={styles.selectedCustomer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{selectedCustomer.full_name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.selectedName}>{selectedCustomer.full_name}</Text>
                  <Text style={styles.selectedSub}>{selectedCustomer.email}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>Seleccionar cliente...</Text>
            )}
            <MaterialCommunityIcons name="chevron-down" size={20} color={tokens.colors.gray400} />
          </TouchableOpacity>

          {/* Items */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>Artículos</Text>
            <TouchableOpacity
              style={styles.addItemBtn}
              onPress={() => { setModalType('product'); setSearchTerm(''); setSearchResults([]) }}
            >
              <MaterialCommunityIcons name="plus" size={16} color={tokens.colors.primary} />
              <Text style={styles.addItemText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>Sin artículos. Toca "Agregar" para añadir.</Text>
            </View>
          ) : (
            items.map(item => (
              <View key={item.key} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.product_name_es}</Text>
                  <TouchableOpacity onPress={() => removeItem(item.key)}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={tokens.colors.error} />
                  </TouchableOpacity>
                </View>
                {item.product_sku ? <Text style={styles.itemSku}>{item.product_sku}</Text> : null}
                <View style={styles.itemInputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Cant.</Text>
                    <TextInput
                      style={styles.numInput}
                      value={String(item.quantity)}
                      onChangeText={v => updateItem(item.key, 'quantity', v)}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Precio Unit. (L.)</Text>
                    <TextInput
                      style={[styles.numInput, { textAlign: 'left', paddingHorizontal: 12 }]}
                      value={String(item.unit_price)}
                      onChangeText={v => updateItem(item.key, 'unit_price', v)}
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Subtotal</Text>
                    <Text style={styles.subtotalText}>L. {(item.quantity * item.unit_price).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* Validity date */}
          <View style={{ marginTop: tokens.spacing.md }}>
            <DatePickerInput
              label="Válida hasta (opcional)"
              value={validUntil}
              onChange={setValidUntil}
              minimumDate={new Date()}
            />
          </View>

          {/* Discount */}
          <Text style={[styles.sectionLabel, { marginTop: tokens.spacing.md }]}>Descuento (L.)</Text>
          <TextInput
            style={styles.textField}
            value={discount}
            onChangeText={setDiscount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={tokens.colors.gray400}
          />

          {/* Notes */}
          <Text style={[styles.sectionLabel, { marginTop: tokens.spacing.md }]}>Notas</Text>
          <TextInput
            style={[styles.textField, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Condiciones, observaciones..."
            placeholderTextColor={tokens.colors.gray400}
          />

          {/* Summary */}
          {items.length > 0 && (
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>L. {subtotal.toFixed(2)}</Text>
              </View>
              {discountAmt > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: tokens.colors.error }]}>Descuento</Text>
                  <Text style={[styles.summaryValue, { color: tokens.colors.error }]}>- L. {discountAmt.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ISV (15%)</Text>
                <Text style={styles.summaryValue}>L. {taxAmount.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.summaryTotalLabel}>TOTAL</Text>
                <Text style={styles.summaryTotalValue}>L. {total.toFixed(2)}</Text>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Customer modal */}
      <Modal visible={modalType === 'customer'} animationType="slide" onRequestClose={() => setModalType(null)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
            <TouchableOpacity onPress={() => setModalType(null)}>
              <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray900} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Buscar por nombre o correo..."
            placeholderTextColor={tokens.colors.gray400}
            autoFocus
          />
          <FlatList
            data={filteredCustomers}
            keyExtractor={c => c.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => { setSelectedCustomer(item); setModalType(null) }}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.full_name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.modalItemName}>{item.full_name}</Text>
                  <Text style={styles.modalItemSub}>{item.email}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Product modal */}
      <Modal visible={modalType === 'product'} animationType="slide" onRequestClose={() => setModalType(null)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar Artículo</Text>
            <TouchableOpacity onPress={() => setModalType(null)}>
              <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray900} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Buscar producto por nombre o SKU..."
            placeholderTextColor={tokens.colors.gray400}
            autoFocus
          />
          <FlatList
            data={searchResults}
            keyExtractor={p => p.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => addItem(item)}>
                <View style={styles.productIcon}>
                  <MaterialCommunityIcons name="package-variant-closed" size={20} color={tokens.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalItemName}>{item.name_es}</Text>
                  <Text style={styles.modalItemSub}>{item.sku}  •  L. {item.price_public.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchTerm.length > 0
                ? <Text style={styles.noResults}>Sin resultados para "{searchTerm}"</Text>
                : <Text style={styles.noResults}>Escribe para buscar productos</Text>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md, paddingVertical: 12,
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100,
  },
  headerClose: { padding: 4 },
  headerTitle: { fontSize: tokens.typography.size.lg, fontWeight: '700', color: tokens.colors.gray900 },
  saveBtn: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: tokens.radius.lg, minWidth: 80, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: tokens.typography.size.base },

  content: { padding: tokens.spacing.md },

  sectionLabel: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.gray800, marginBottom: 6 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: tokens.spacing.md, marginBottom: 6 },

  selectorBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: tokens.colors.bgLight, borderWidth: 1, borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.lg, padding: tokens.spacing.md, marginBottom: tokens.spacing.md,
  },
  selectedCustomer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedName: { fontSize: tokens.typography.size.base, fontWeight: '700', color: tokens.colors.gray900 },
  selectedSub: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400 },
  selectorPlaceholder: { fontSize: tokens.typography.size.base, color: tokens.colors.gray400 },

  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: tokens.colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: tokens.colors.primary, fontWeight: '700', fontSize: 14 },

  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addItemText: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.primary },

  emptyItems: { padding: 20, borderRadius: tokens.radius.lg, borderWidth: 1, borderColor: tokens.colors.gray200, borderStyle: 'dashed', alignItems: 'center', marginBottom: tokens.spacing.md },
  emptyItemsText: { color: tokens.colors.gray400, fontSize: tokens.typography.size.sm },

  itemCard: { backgroundColor: tokens.colors.bgLight, borderRadius: tokens.radius.lg, padding: tokens.spacing.md, marginBottom: tokens.spacing.sm, ...tokens.shadow.sm },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  itemName: { flex: 1, fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.gray900, marginRight: 8 },
  itemSku: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginBottom: 8 },
  itemInputRow: { flexDirection: 'row', gap: tokens.spacing.sm, alignItems: 'flex-end' },
  inputGroup: { alignItems: 'center' },
  inputLabel: { fontSize: 10, color: tokens.colors.gray400, marginBottom: 4, fontWeight: '600' },
  numInput: { width: 60, borderWidth: 1, borderColor: tokens.colors.gray200, borderRadius: 8, paddingVertical: 6, textAlign: 'center', fontSize: 14, color: tokens.colors.gray900, backgroundColor: tokens.colors.bgScreen },
  subtotalText: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.primary, paddingVertical: 6 },

  textField: {
    backgroundColor: tokens.colors.bgLight, borderWidth: 1, borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.lg, padding: tokens.spacing.md,
    fontSize: tokens.typography.size.base, color: tokens.colors.gray900,
  },

  summary: { marginTop: tokens.spacing.lg, backgroundColor: tokens.colors.bgLight, borderRadius: tokens.radius.xl, padding: tokens.spacing.md, ...tokens.shadow.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  summaryLabel: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray600 },
  summaryValue: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray800 },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: tokens.colors.gray100, marginTop: 4, paddingTop: 10 },
  summaryTotalLabel: { fontSize: tokens.typography.size.base, fontWeight: '800', color: tokens.colors.gray900 },
  summaryTotalValue: { fontSize: tokens.typography.size.lg, fontWeight: '800', color: tokens.colors.primary },

  modal: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: tokens.spacing.md, borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100 },
  modalTitle: { fontSize: tokens.typography.size.lg, fontWeight: '700', color: tokens.colors.gray900 },
  searchInput: {
    margin: tokens.spacing.md,
    backgroundColor: tokens.colors.bgLight,
    borderWidth: 1, borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.md, paddingVertical: 10,
    fontSize: tokens.typography.size.base, color: tokens.colors.gray900,
  },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: tokens.spacing.md, borderBottomWidth: 1, borderBottomColor: tokens.colors.gray50 },
  modalItemName: { fontSize: tokens.typography.size.base, fontWeight: '600', color: tokens.colors.gray900 },
  modalItemSub: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400 },
  productIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: tokens.colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  noResults: { textAlign: 'center', color: tokens.colors.gray400, marginTop: 40, fontSize: tokens.typography.size.sm },
})
