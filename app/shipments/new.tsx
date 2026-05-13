import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  TextInput, Modal, FlatList,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ShipmentService } from '@/services/shipment.service'
import { DatePickerInput } from '@/components/common/DatePickerInput'
import { tokens } from '@/theme/tokens'
import { supabase } from '@/lib/supabase'
import { Order } from '@/types/database.types'

export default function NewShipmentScreen() {
  const router = useRouter()
  const { orderId } = useLocalSearchParams<{ orderId?: string }>()

  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [confirmedOrders, setConfirmedOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [shippingCost, setShippingCost] = useState('')
  const [estimatedDelivery, setEstimatedDelivery] = useState<Date | null>(null)
  const [notes, setNotes] = useState('')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')

  useEffect(() => {
    async function loadOrders() {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*, profiles(full_name, phone)')
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false })

        const orders = (data ?? []) as Order[]
        setConfirmedOrders(orders)

        if (orderId) {
          const match = orders.find(o => o.id === orderId)
          if (match) setSelectedOrder(match)
        }
      } catch {
        Alert.alert('Error', 'No se pudieron cargar los pedidos.')
      } finally {
        setFetching(false)
      }
    }
    loadOrders()
  }, [orderId])

  const filteredOrders = confirmedOrders.filter(o => {
    const search = orderSearch.toLowerCase()
    return (
      o.order_number?.toLowerCase().includes(search) ||
      (o.profiles as any)?.full_name?.toLowerCase().includes(search)
    )
  })

  const handleSave = async () => {
    if (!selectedOrder) { Alert.alert('Error', 'Selecciona un pedido.'); return }

    setSaving(true)
    try {
      const shipment = await ShipmentService.create({
        order_id: selectedOrder.id,
        tracking_number: trackingNumber.trim() || undefined,
        tracking_url: trackingUrl.trim() || undefined,
        shipping_cost: parseFloat(shippingCost) || undefined,
        estimated_delivery: estimatedDelivery ? estimatedDelivery.toISOString() : undefined,
        notes: notes.trim() || undefined,
      })
      Alert.alert('Envío creado', 'El envío fue registrado correctamente.', [
        { text: 'Ver Envío', onPress: () => router.replace(`/shipments/${shipment.id}` as any) },
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch {
      Alert.alert('Error', 'No se pudo crear el envío.')
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerClose}>
            <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuevo Envío</Text>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.saveBtnText}>Crear</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order picker */}
          <Text style={styles.sectionLabel}>Pedido Confirmado *</Text>
          <TouchableOpacity
            style={styles.selectorBtn}
            onPress={() => { setShowOrderModal(true); setOrderSearch('') }}
          >
            {selectedOrder ? (
              <View style={styles.selectedOrder}>
                <MaterialCommunityIcons name="receipt-outline" size={18} color={tokens.colors.primary} />
                <View>
                  <Text style={styles.selectedName}>#{selectedOrder.order_number}</Text>
                  <Text style={styles.selectedSub}>
                    {(selectedOrder.profiles as any)?.full_name ?? 'Cliente'}  •  L. {selectedOrder.total?.toFixed(2)}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>Seleccionar pedido confirmado...</Text>
            )}
            <MaterialCommunityIcons name="chevron-down" size={20} color={tokens.colors.gray400} />
          </TouchableOpacity>

          {/* Tracking */}
          <Text style={styles.sectionLabel}>Número de seguimiento</Text>
          <TextInput
            style={styles.textField}
            value={trackingNumber}
            onChangeText={setTrackingNumber}
            placeholder="Ej. TRK123456"
            placeholderTextColor={tokens.colors.gray400}
            autoCapitalize="characters"
          />

          <Text style={[styles.sectionLabel, { marginTop: tokens.spacing.md }]}>URL de rastreo</Text>
          <TextInput
            style={styles.textField}
            value={trackingUrl}
            onChangeText={setTrackingUrl}
            placeholder="https://..."
            placeholderTextColor={tokens.colors.gray400}
            keyboardType="url"
            autoCapitalize="none"
          />

          <Text style={[styles.sectionLabel, { marginTop: tokens.spacing.md }]}>Costo de envío (L.)</Text>
          <TextInput
            style={styles.textField}
            value={shippingCost}
            onChangeText={setShippingCost}
            placeholder="0.00"
            placeholderTextColor={tokens.colors.gray400}
            keyboardType="decimal-pad"
          />

          <View style={{ marginTop: tokens.spacing.md }}>
            <DatePickerInput
              label="Fecha estimada de entrega"
              value={estimatedDelivery}
              onChange={setEstimatedDelivery}
              minimumDate={new Date()}
            />
          </View>

          <Text style={[styles.sectionLabel, { marginTop: tokens.spacing.md }]}>Notas</Text>
          <TextInput
            style={[styles.textField, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Instrucciones especiales, dirección..."
            placeholderTextColor={tokens.colors.gray400}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showOrderModal} animationType="slide" onRequestClose={() => setShowOrderModal(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Pedido</Text>
            <TouchableOpacity onPress={() => setShowOrderModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray900} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            value={orderSearch}
            onChangeText={setOrderSearch}
            placeholder="Buscar por número o cliente..."
            placeholderTextColor={tokens.colors.gray400}
            autoFocus
          />
          {confirmedOrders.length === 0 ? (
            <View style={styles.noOrdersWrap}>
              <MaterialCommunityIcons name="clipboard-alert-outline" size={48} color={tokens.colors.gray400} />
              <Text style={styles.noOrdersText}>No hay pedidos confirmados disponibles</Text>
              <Text style={styles.noOrdersSub}>Confirma un pedido primero desde Ventas</Text>
            </View>
          ) : (
            <FlatList
              data={filteredOrders}
              keyExtractor={o => o.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setSelectedOrder(item); setShowOrderModal(false) }}
                >
                  <View style={styles.orderIcon}>
                    <MaterialCommunityIcons name="receipt-outline" size={20} color={tokens.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemName}>Pedido #{item.order_number}</Text>
                    <Text style={styles.modalItemSub}>
                      {(item.profiles as any)?.full_name ?? 'Cliente'}  •  L. {item.total?.toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
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
    backgroundColor: '#f59e0b',
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: tokens.radius.lg, minWidth: 80, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: tokens.typography.size.base },
  content: { padding: tokens.spacing.md },
  sectionLabel: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.gray800, marginBottom: 6 },
  selectorBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: tokens.colors.bgLight, borderWidth: 1, borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.lg, padding: tokens.spacing.md, marginBottom: tokens.spacing.md,
  },
  selectedOrder: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedName: { fontSize: tokens.typography.size.base, fontWeight: '700', color: tokens.colors.gray900 },
  selectedSub: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400 },
  selectorPlaceholder: { fontSize: tokens.typography.size.base, color: tokens.colors.gray400 },
  textField: {
    backgroundColor: tokens.colors.bgLight, borderWidth: 1, borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.lg, padding: tokens.spacing.md,
    fontSize: tokens.typography.size.base, color: tokens.colors.gray900,
    marginBottom: tokens.spacing.xs,
  },
  modal: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: tokens.spacing.md, borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100,
  },
  modalTitle: { fontSize: tokens.typography.size.lg, fontWeight: '700', color: tokens.colors.gray900 },
  searchInput: {
    margin: tokens.spacing.md,
    backgroundColor: tokens.colors.bgLight, borderWidth: 1, borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.lg, paddingHorizontal: tokens.spacing.md, paddingVertical: 10,
    fontSize: tokens.typography.size.base, color: tokens.colors.gray900,
  },
  noOrdersWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  noOrdersText: { fontSize: tokens.typography.size.base, fontWeight: '700', color: tokens.colors.gray600, marginTop: 12 },
  noOrdersSub: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray400, marginTop: 4, textAlign: 'center' },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: tokens.spacing.md, borderBottomWidth: 1, borderBottomColor: tokens.colors.gray50,
  },
  orderIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: tokens.colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  modalItemName: { fontSize: tokens.typography.size.base, fontWeight: '600', color: tokens.colors.gray900 },
  modalItemSub: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400 },
})
