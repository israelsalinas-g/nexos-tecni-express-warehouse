import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, Linking, RefreshControl,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OrderDetailService, OrderDetail } from '@/services/order-detail.service'
import { StatusBadge } from '@/components/common/StatusBadge'
import { BottomSheet } from '@/components/common/BottomSheet'
import { SectionCard } from '@/components/common/SectionCard'
import { tokens } from '@/theme/tokens'
import { Order } from '@/types/database.types'

const ORDER_STATUS_MAP = {
  pending:    { label: 'Pendiente',    color: '#D97706', bg: '#FEF3C7' },
  confirmed:  { label: 'Confirmado',   color: '#2563EB', bg: '#DBEAFE' },
  shipped:    { label: 'Enviado',      color: '#7C3AED', bg: '#EDE9FE' },
  delivered:  { label: 'Entregado',    color: '#059669', bg: '#D1FAE5' },
  cancelled:  { label: 'Cancelado',    color: '#DC2626', bg: '#FEE2E2' },
}

const STATUS_TRANSITIONS: Record<Order['status'], { next: Order['status']; label: string; icon: string }[]> = {
  pending:   [
    { next: 'confirmed',  label: 'Confirmar pedido',  icon: 'check-circle-outline' },
    { next: 'cancelled',  label: 'Cancelar pedido',   icon: 'close-circle-outline' },
  ],
  confirmed: [
    { next: 'shipped',    label: 'Marcar enviado',    icon: 'truck-outline' },
    { next: 'cancelled',  label: 'Cancelar pedido',   icon: 'close-circle-outline' },
  ],
  shipped:   [
    { next: 'delivered',  label: 'Marcar entregado',  icon: 'package-variant-closed-check' },
  ],
  delivered: [],
  cancelled: [],
}

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusSheetOpen, setStatusSheetOpen] = useState(false)
  const [noteSheetOpen, setNoteSheetOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await OrderDetailService.getById(orderId)
      setOrder(data)
      if (data?.notes_internal) setNoteText(data.notes_internal)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [orderId])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (next: Order['status']) => {
    setChangingStatus(true)
    try {
      await OrderDetailService.updateStatus(orderId, next)
      setStatusSheetOpen(false)
      load()
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el estado.')
    } finally {
      setChangingStatus(false)
    }
  }

  const handleSaveNote = async () => {
    setSavingNote(true)
    try {
      await OrderDetailService.addNote(orderId, noteText)
      setNoteSheetOpen(false)
      Alert.alert('Listo', 'Nota guardada.')
    } catch {
      Alert.alert('Error', 'No se pudo guardar la nota.')
    } finally {
      setSavingNote(false)
    }
  }

  const openWhatsApp = (phone: string) => {
    const clean = phone.replace(/\D/g, '')
    Linking.openURL(`https://wa.me/504${clean}`)
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    )
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="file-remove-outline" size={56} color={tokens.colors.gray400} />
        <Text style={styles.notFoundText}>Pedido no encontrado</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Regresar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const transitions = STATUS_TRANSITIONS[order.status] ?? []
  const canCreateInvoice = order.status === 'confirmed' && order.payment_status !== 'paid'
  const canCreateShipment = order.status === 'confirmed'

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={tokens.colors.primary} />}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.orderNum}>#{order.order_number}</Text>
            <Text style={styles.dateText}>{new Date(order.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
          </View>
          <StatusBadge status={order.status} map={ORDER_STATUS_MAP} />
        </View>

        {/* ── Cliente ── */}
        <SectionCard title="Cliente">
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(order.profiles as any)?.full_name?.charAt(0) ?? 'C'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{(order.profiles as any)?.full_name ?? 'Cliente Final'}</Text>
              <Text style={styles.customerSub}>{(order.profiles as any)?.email ?? ''}</Text>
              {(order.profiles as any)?.phone && (
                <Text style={styles.customerSub}>{(order.profiles as any).phone}</Text>
              )}
            </View>
            {(order.profiles as any)?.phone && (
              <TouchableOpacity
                style={styles.waBtn}
                onPress={() => openWhatsApp((order.profiles as any).phone)}
              >
                <MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />
              </TouchableOpacity>
            )}
          </View>
        </SectionCard>

        {/* ── Dirección de envío ── */}
        {order.shipping_address && (
          <SectionCard title="Dirección de Envío">
            <View style={styles.addressRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={tokens.colors.gray400} />
              <Text style={styles.addressText}>
                {[order.shipping_name, order.shipping_address, order.shipping_city].filter(Boolean).join(' · ')}
              </Text>
            </View>
            {order.shipping_phone && (
              <View style={styles.addressRow}>
                <MaterialCommunityIcons name="phone-outline" size={18} color={tokens.colors.gray400} />
                <Text style={styles.addressText}>{order.shipping_phone}</Text>
              </View>
            )}
          </SectionCard>
        )}

        {/* ── Ítems ── */}
        <SectionCard title={`Productos (${order.order_items?.length ?? 0})`} noPadding>
          {(order.order_items ?? []).map((item, i) => (
            <View
              key={item.id ?? i}
              style={[styles.itemRow, i < (order.order_items?.length ?? 0) - 1 && styles.itemBorder]}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.product_name_es}</Text>
                {item.product_sku && <Text style={styles.itemSku}>{item.product_sku}</Text>}
              </View>
              <View style={styles.itemPricing}>
                <Text style={styles.itemQty}>{item.quantity} ×</Text>
                <Text style={styles.itemPrice}>L. {item.unit_price?.toFixed(2)}</Text>
                <Text style={styles.itemSubtotal}>L. {item.subtotal?.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </SectionCard>

        {/* ── Resumen Financiero ── */}
        <SectionCard title="Resumen">
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>L. {order.subtotal?.toFixed(2)}</Text>
          </View>
          {(order.discount ?? 0) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Descuento</Text>
              <Text style={[styles.summaryVal, { color: tokens.colors.success }]}>-L. {order.discount?.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ISV 15%</Text>
            <Text style={styles.summaryVal}>L. {order.tax_amount?.toFixed(2)}</Text>
          </View>
          {(order.shipping_cost ?? 0) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Envío</Text>
              <Text style={styles.summaryVal}>L. {order.shipping_cost?.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalVal}>L. {order.total?.toFixed(2)}</Text>
          </View>
          {order.payment_method && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Método de pago</Text>
              <Text style={styles.summaryVal}>{order.payment_method}</Text>
            </View>
          )}
        </SectionCard>

        {/* ── Nota interna ── */}
        <SectionCard
          title="Nota Interna"
          rightAction={{ label: order.notes_internal ? 'Editar' : '+ Agregar', onPress: () => setNoteSheetOpen(true) }}
        >
          {order.notes_internal
            ? <Text style={styles.noteText}>{order.notes_internal}</Text>
            : <Text style={styles.notePlaceholder}>Sin notas internas</Text>
          }
        </SectionCard>

        {/* ── Historial de estados ── */}
        {(order.order_status_history?.length ?? 0) > 0 && (
          <SectionCard title="Historial">
            {order.order_status_history.map((h, i) => (
              <View key={h.id ?? i} style={[styles.historyRow, i < order.order_status_history.length - 1 && styles.historyBorder]}>
                <View style={styles.historyDot} />
                <View style={{ flex: 1 }}>
                  <View style={styles.historyHeader}>
                    <StatusBadge status={h.status} map={ORDER_STATUS_MAP} size="sm" />
                    <Text style={styles.historyDate}>{new Date(h.created_at).toLocaleDateString('es-HN')}</Text>
                  </View>
                  {h.note && <Text style={styles.historyNote}>{h.note}</Text>}
                  {(h as any).profiles?.full_name && (
                    <Text style={styles.historyUser}>{(h as any).profiles.full_name}</Text>
                  )}
                </View>
              </View>
            ))}
          </SectionCard>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Actions ── */}
      <View style={styles.bottomBar}>
        {transitions.length > 0 && (
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => setStatusSheetOpen(true)}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={18} color={tokens.colors.primary} />
            <Text style={styles.actionBtnSecondaryText}>Cambiar estado</Text>
          </TouchableOpacity>
        )}
        {canCreateInvoice && (
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => router.push(`/invoices/new?fromOrderId=${order.id}` as any)}
          >
            <MaterialCommunityIcons name="receipt-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnPrimaryText}>Facturar</Text>
          </TouchableOpacity>
        )}
        {canCreateShipment && (
          <TouchableOpacity
            style={[styles.actionBtnPrimary, { backgroundColor: tokens.colors.info }]}
            onPress={() => router.push(`/shipments/new?orderId=${order.id}` as any)}
          >
            <MaterialCommunityIcons name="truck-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnPrimaryText}>Crear Envío</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Status Change Sheet ── */}
      <BottomSheet
        visible={statusSheetOpen}
        onClose={() => setStatusSheetOpen(false)}
        title="Cambiar Estado"
      >
        <View style={styles.sheetBody}>
          {transitions.map(t => (
            <TouchableOpacity
              key={t.next}
              style={[
                styles.transitionBtn,
                t.next === 'cancelled' && styles.transitionBtnDestructive,
              ]}
              onPress={() => handleStatusChange(t.next)}
              disabled={changingStatus}
            >
              {changingStatus ? (
                <ActivityIndicator size="small" color={t.next === 'cancelled' ? tokens.colors.error : tokens.colors.primary} />
              ) : (
                <MaterialCommunityIcons
                  name={t.icon as any}
                  size={20}
                  color={t.next === 'cancelled' ? tokens.colors.error : tokens.colors.primary}
                />
              )}
              <Text style={[
                styles.transitionBtnText,
                t.next === 'cancelled' && { color: tokens.colors.error },
              ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>

      {/* ── Note Sheet ── */}
      <BottomSheet
        visible={noteSheetOpen}
        onClose={() => setNoteSheetOpen(false)}
        title="Nota Interna"
      >
        <View style={styles.sheetBody}>
          <TextInput
            style={styles.noteInput}
            value={noteText}
            onChangeText={setNoteText}
            multiline
            numberOfLines={4}
            placeholder="Escribe una nota interna sobre este pedido..."
            placeholderTextColor={tokens.colors.gray400}
          />
          <TouchableOpacity
            style={styles.saveNoteBtn}
            onPress={handleSaveNote}
            disabled={savingNote}
          >
            {savingNote
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.saveNoteBtnText}>Guardar nota</Text>
            }
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  content: { padding: tokens.spacing.md },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.md,
  },
  orderNum: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: tokens.colors.gray900 },
  dateText: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 2 },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: tokens.colors.primary + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: tokens.colors.primary, fontWeight: '700', fontSize: 18 },
  customerName: { fontSize: tokens.typography.size.base, fontWeight: '700', color: tokens.colors.gray900 },
  customerSub: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 1 },
  waBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E9FBF0', justifyContent: 'center', alignItems: 'center' },

  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  addressText: { flex: 1, fontSize: tokens.typography.size.sm, color: tokens.colors.gray600, lineHeight: 20 },

  itemRow: { flexDirection: 'row', paddingHorizontal: tokens.spacing.md, paddingVertical: 12 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100 },
  itemInfo: { flex: 1, paddingRight: 12 },
  itemName: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray900 },
  itemSku: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 2 },
  itemPricing: { alignItems: 'flex-end', gap: 2 },
  itemQty: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400 },
  itemPrice: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray600 },
  itemSubtotal: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.gray900 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray400 },
  summaryVal: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray900 },
  summaryTotal: { borderTopWidth: 1, borderTopColor: tokens.colors.gray100, marginTop: 4, paddingTop: 12 },
  totalLabel: { fontSize: tokens.typography.size.base, fontWeight: '800', color: tokens.colors.gray900 },
  totalVal: { fontSize: tokens.typography.size.lg, fontWeight: '800', color: tokens.colors.primary },

  noteText: { fontSize: tokens.typography.size.base, color: tokens.colors.gray600, lineHeight: 22 },
  notePlaceholder: { fontSize: tokens.typography.size.base, color: tokens.colors.gray400, fontStyle: 'italic' },

  historyRow: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  historyBorder: { borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100 },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: tokens.colors.primary, marginTop: 5 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  historyDate: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400 },
  historyNote: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray600, marginTop: 2 },
  historyUser: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 2 },

  bottomBar: {
    flexDirection: 'row',
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.bgLight,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.gray100,
    ...tokens.shadow.lg,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: tokens.radius.lg,
    borderWidth: 1.5,
    borderColor: tokens.colors.primary,
  },
  actionBtnSecondaryText: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.primary },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.primary,
    ...tokens.shadow.sm,
  },
  actionBtnPrimaryText: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: '#fff' },

  sheetBody: { padding: tokens.spacing.lg, gap: tokens.spacing.sm },
  transitionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.primary + '10',
  },
  transitionBtnDestructive: { backgroundColor: tokens.colors.errorContainer },
  transitionBtnText: { fontSize: tokens.typography.size.base, fontWeight: '600', color: tokens.colors.primary },

  noteInput: {
    borderWidth: 1.5,
    borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    fontSize: tokens.typography.size.base,
    color: tokens.colors.gray900,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveNoteBtn: {
    backgroundColor: tokens.colors.primary,
    paddingVertical: 14,
    borderRadius: tokens.radius.lg,
    alignItems: 'center',
  },
  saveNoteBtnText: { color: '#fff', fontSize: tokens.typography.size.base, fontWeight: '700' },

  notFoundText: { fontSize: tokens.typography.size.lg, fontWeight: '700', color: tokens.colors.gray800, marginTop: 16 },
  backBtn: { marginTop: 20, backgroundColor: tokens.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: tokens.radius.lg },
  backBtnText: { color: '#fff', fontWeight: '700' },
})
