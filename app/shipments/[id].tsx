import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Linking,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ShipmentService, ShipmentDetail } from '@/services/shipment.service'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SectionCard } from '@/components/common/SectionCard'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { BottomSheet } from '@/components/common/BottomSheet'
import { tokens } from '@/theme/tokens'
import { SHIPMENT_STATUS_MAP } from '@/app/(tabs)/shipments'
import { ShipmentStatus } from '@/types/database.types'

const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending:    ['dispatched', 'returned'],
  dispatched: ['in_transit', 'returned'],
  in_transit: ['delivered', 'returned'],
  delivered:  [],
  returned:   [],
}

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending:    'Pendiente',
  dispatched: 'Despachado',
  in_transit: 'En Tránsito',
  delivered:  'Entregado',
  returned:   'Devuelto',
}

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const [shipment, setShipment] = useState<ShipmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmStatus, setConfirmStatus] = useState<ShipmentStatus | null>(null)
  const [showTrackingSheet, setShowTrackingSheet] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await ShipmentService.getById(id)
      if (!data) { Alert.alert('Error', 'Envío no encontrado'); router.back(); return }
      setShipment(data)
      setTrackingNumber(data.tracking_number ?? '')
      setTrackingUrl(data.tracking_url ?? '')
    } catch {
      Alert.alert('Error', 'No se pudo cargar el envío.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (newStatus: ShipmentStatus) => {
    setActionLoading(true)
    try {
      await ShipmentService.updateStatus(id, newStatus)
      setShipment(prev => prev ? { ...prev, status: newStatus } : prev)
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el estado.')
    } finally {
      setActionLoading(false)
      setConfirmStatus(null)
    }
  }

  const handleSaveTracking = async () => {
    if (!trackingNumber.trim()) { Alert.alert('Error', 'Ingresa el número de seguimiento.'); return }
    setActionLoading(true)
    try {
      await ShipmentService.updateTracking(id, trackingNumber.trim(), trackingUrl.trim() || undefined)
      setShipment(prev => prev ? { ...prev, tracking_number: trackingNumber.trim(), tracking_url: trackingUrl.trim() || undefined } : prev)
      setShowTrackingSheet(false)
    } catch {
      Alert.alert('Error', 'No se pudo guardar el seguimiento.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    )
  }

  if (!shipment) return null

  const transitions = STATUS_TRANSITIONS[shipment.status]
  const order = shipment.orders as any
  const profiles = order?.profiles

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>Envío #{id.slice(-6).toUpperCase()}</Text>
          <StatusBadge status={shipment.status} map={SHIPMENT_STATUS_MAP} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order info */}
        {order && (
          <SectionCard title="Pedido Origen">
            <TouchableOpacity
              style={styles.orderLink}
              onPress={() => router.push(`/orders/${order.id}` as any)}
            >
              <MaterialCommunityIcons name="receipt-outline" size={16} color={tokens.colors.primary} />
              <Text style={styles.orderLinkText}>Pedido #{order.order_number}</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={tokens.colors.primary} />
            </TouchableOpacity>

            {profiles && (
              <View style={styles.customerRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{profiles.full_name?.charAt(0) ?? 'C'}</Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{profiles.full_name}</Text>
                  {profiles.phone ? <Text style={styles.customerPhone}>{profiles.phone}</Text> : null}
                </View>
                {profiles.phone && (
                  <TouchableOpacity
                    style={styles.waBtn}
                    onPress={() => Linking.openURL(`https://wa.me/504${profiles.phone.replace(/\D/g, '')}`)}
                  >
                    <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </SectionCard>
        )}

        {/* Tracking */}
        <SectionCard
          title="Seguimiento"
          rightAction={shipment.status !== 'delivered' && shipment.status !== 'returned'
            ? { label: 'Editar', onPress: () => setShowTrackingSheet(true) }
            : undefined
          }
        >
          {shipment.tracking_number ? (
            <>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="barcode" size={16} color={tokens.colors.gray400} />
                <Text style={styles.trackingNumber}>{shipment.tracking_number}</Text>
              </View>
              {shipment.tracking_url ? (
                <TouchableOpacity
                  style={styles.trackingLinkBtn}
                  onPress={() => Linking.openURL(shipment.tracking_url!)}
                >
                  <MaterialCommunityIcons name="open-in-new" size={14} color={tokens.colors.primary} />
                  <Text style={styles.trackingLinkText}>Ver en transportista</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <Text style={styles.noTracking}>Sin número de seguimiento</Text>
          )}
        </SectionCard>

        {/* Dates */}
        <SectionCard title="Fechas">
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar-plus-outline" size={16} color={tokens.colors.gray400} />
            <Text style={styles.infoLabel}>Creado:</Text>
            <Text style={styles.infoValue}>
              {new Date(shipment.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          {shipment.dispatched_at && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="truck-check-outline" size={16} color={tokens.colors.gray400} />
              <Text style={styles.infoLabel}>Despachado:</Text>
              <Text style={styles.infoValue}>
                {new Date(shipment.dispatched_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          )}
          {shipment.delivered_at && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={tokens.colors.success} />
              <Text style={[styles.infoLabel, { color: tokens.colors.success }]}>Entregado:</Text>
              <Text style={[styles.infoValue, { color: tokens.colors.success }]}>
                {new Date(shipment.delivered_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          )}
          {shipment.estimated_delivery && !shipment.delivered_at && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar-clock" size={16} color={tokens.colors.gray400} />
              <Text style={styles.infoLabel}>Est. entrega:</Text>
              <Text style={styles.infoValue}>
                {new Date(shipment.estimated_delivery).toLocaleDateString('es-HN', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          )}
        </SectionCard>

        {shipment.notes ? (
          <SectionCard title="Notas">
            <Text style={styles.notesText}>{shipment.notes}</Text>
          </SectionCard>
        ) : null}

        {shipment.shipping_cost ? (
          <SectionCard title="Costo de Envío">
            <Text style={styles.costText}>L. {shipment.shipping_cost.toFixed(2)}</Text>
          </SectionCard>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom actions */}
      {transitions.length > 0 && (
        <View style={styles.bottomBar}>
          {transitions.map(s => (
            <TouchableOpacity
              key={s}
              style={[
                styles.transitionBtn,
                s === 'returned' && styles.transitionBtnDanger,
                s === 'delivered' && { backgroundColor: tokens.colors.success },
              ]}
              onPress={() => setConfirmStatus(s)}
              disabled={actionLoading}
            >
              <Text style={styles.transitionBtnText}>{STATUS_LABELS[s]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ConfirmSheet
        visible={confirmStatus !== null}
        title={`Cambiar estado a "${confirmStatus ? STATUS_LABELS[confirmStatus] : ''}"`}
        message={
          confirmStatus === 'delivered'
            ? 'El pedido asociado también se marcará como entregado.'
            : 'Se actualizará el estado del envío.'
        }
        confirmLabel="Confirmar"
        destructive={confirmStatus === 'returned'}
        onConfirm={() => { if (confirmStatus) handleStatusChange(confirmStatus) }}
        onCancel={() => setConfirmStatus(null)}
      />

      <BottomSheet
        visible={showTrackingSheet}
        onClose={() => setShowTrackingSheet(false)}
        title="Actualizar Seguimiento"
        height="50%"
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetLabel}>Número de seguimiento *</Text>
          <TextInput
            style={styles.sheetInput}
            value={trackingNumber}
            onChangeText={setTrackingNumber}
            placeholder="Ej. TRK123456"
            placeholderTextColor={tokens.colors.gray400}
            autoCapitalize="characters"
          />
          <Text style={[styles.sheetLabel, { marginTop: 12 }]}>URL de rastreo (opcional)</Text>
          <TextInput
            style={styles.sheetInput}
            value={trackingUrl}
            onChangeText={setTrackingUrl}
            placeholder="https://..."
            placeholderTextColor={tokens.colors.gray400}
            keyboardType="url"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.sheetSaveBtn, actionLoading && { opacity: 0.6 }]}
            onPress={handleSaveTracking}
            disabled={actionLoading}
          >
            {actionLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.sheetSaveBtnText}>Guardar</Text>
            }
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: tokens.spacing.md, paddingVertical: 12,
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100,
    gap: tokens.spacing.sm,
  },
  headerBack: { padding: 4 },
  headerMid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  headerTitle: { fontSize: tokens.typography.size.lg, fontWeight: '800', color: tokens.colors.gray900 },

  content: { padding: tokens.spacing.md },

  orderLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: tokens.spacing.sm },
  orderLinkText: { flex: 1, fontSize: tokens.typography.size.base, fontWeight: '700', color: tokens.colors.primary },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f59e0b20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#f59e0b', fontWeight: '700', fontSize: 14 },
  customerInfo: { flex: 1 },
  customerName: { fontSize: tokens.typography.size.base, fontWeight: '700', color: tokens.colors.gray900 },
  customerPhone: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400 },
  waBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E9FBF0', justifyContent: 'center', alignItems: 'center' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoLabel: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray600, fontWeight: '600', marginRight: 4 },
  infoValue: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray800 },

  trackingNumber: { fontSize: tokens.typography.size.base, fontWeight: '700', color: tokens.colors.gray900, fontFamily: 'monospace' },
  trackingLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  trackingLinkText: { fontSize: tokens.typography.size.sm, color: tokens.colors.primary, fontWeight: '600' },
  noTracking: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray400 },

  notesText: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray600, lineHeight: 20 },
  costText: { fontSize: tokens.typography.size.base, fontWeight: '700', color: tokens.colors.gray900 },

  bottomBar: {
    flexDirection: 'row', gap: tokens.spacing.sm,
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.bgLight,
    borderTopWidth: 1, borderTopColor: tokens.colors.gray100,
  },
  transitionBtn: {
    flex: 1, backgroundColor: '#f59e0b', paddingVertical: 12,
    borderRadius: tokens.radius.lg, alignItems: 'center',
    ...tokens.shadow.sm,
  },
  transitionBtnDanger: { backgroundColor: tokens.colors.error },
  transitionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  sheetContent: { paddingHorizontal: tokens.spacing.md },
  sheetLabel: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.gray800, marginBottom: 6 },
  sheetInput: {
    backgroundColor: tokens.colors.bgScreen, borderWidth: 1, borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.lg, padding: tokens.spacing.md,
    fontSize: tokens.typography.size.base, color: tokens.colors.gray900,
  },
  sheetSaveBtn: {
    marginTop: 20, backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.lg, paddingVertical: 13, alignItems: 'center',
  },
  sheetSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: tokens.typography.size.base },
})
