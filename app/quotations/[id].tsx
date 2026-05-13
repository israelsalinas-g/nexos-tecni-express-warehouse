import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { QuotationService, QuotationDetail } from '@/services/quotation.service'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SectionCard } from '@/components/common/SectionCard'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { tokens } from '@/theme/tokens'
import { QUOTATION_STATUS_MAP } from './index'
import { QuotationStatus } from '@/types/database.types'

export default function QuotationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const [quotation, setQuotation] = useState<QuotationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ status: QuotationStatus; label: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await QuotationService.getById(id)
      if (!data) { Alert.alert('Error', 'Cotización no encontrada'); router.back(); return }
      setQuotation(data)
    } catch {
      Alert.alert('Error', 'No se pudo cargar la cotización.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (newStatus: QuotationStatus) => {
    if (!quotation) return
    setActionLoading(true)
    try {
      await QuotationService.updateStatus(id, newStatus)
      setQuotation(prev => prev ? { ...prev, status: newStatus } : prev)
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el estado.')
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
    }
  }

  const handleConvertToOrder = async () => {
    if (!quotation) return
    setActionLoading(true)
    try {
      const order = await QuotationService.convertToOrder(id)
      Alert.alert('¡Convertida!', 'Cotización convertida a pedido correctamente.', [
        { text: 'Ver Pedido', onPress: () => router.replace(`/orders/${order.id}` as any) },
        { text: 'OK' },
      ])
    } catch {
      Alert.alert('Error', 'No se pudo convertir la cotización a pedido.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await QuotationService.delete(id)
      router.back()
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la cotización.')
      setActionLoading(false)
    }
  }

  const handleSharePDF = async () => {
    if (!quotation) return
    try {
      await QuotationService.generateAndSharePDF(quotation)
    } catch {
      Alert.alert('Error', 'No se pudo generar el PDF.')
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    )
  }

  if (!quotation) return null

  const status = quotation.status
  const canEdit       = status === 'draft'
  const canSend       = status === 'draft'
  const canAccept     = status === 'sent'
  const canReject     = status === 'sent'
  const canExpire     = status === 'sent'
  const canConvert    = status === 'accepted'
  const canDelete     = status === 'draft'
  const canSharePDF   = status !== 'cancelled'

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>#{quotation.quotation_number}</Text>
          <StatusBadge status={quotation.status} map={QUOTATION_STATUS_MAP} />
        </View>
        {canSharePDF && (
          <TouchableOpacity style={styles.headerAction} onPress={handleSharePDF}>
            <MaterialCommunityIcons name="share-outline" size={22} color={tokens.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer */}
        <SectionCard title="Cliente">
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-outline" size={16} color={tokens.colors.gray400} />
            <Text style={styles.infoText}>{quotation.customer_name ?? '—'}</Text>
          </View>
          {quotation.customer_email ? (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="email-outline" size={16} color={tokens.colors.gray400} />
              <Text style={styles.infoText}>{quotation.customer_email}</Text>
            </View>
          ) : null}
          {quotation.valid_until ? (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar-clock" size={16} color={tokens.colors.gray400} />
              <Text style={styles.infoText}>
                Válida hasta {new Date(quotation.valid_until).toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          ) : null}
        </SectionCard>

        {/* Items */}
        <SectionCard title={`Artículos (${quotation.items.length})`}>
          {quotation.items.map((item, i) => (
            <View key={item.id} style={[styles.itemRow, i < quotation.items.length - 1 && styles.itemRowBorder]}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product_name_es}</Text>
                {item.product_sku ? <Text style={styles.itemSku}>{item.product_sku}</Text> : null}
              </View>
              <View style={styles.itemPricing}>
                <Text style={styles.itemQtyPrice}>{item.quantity} × L. {item.unit_price.toFixed(2)}</Text>
                <Text style={styles.itemSubtotal}>L. {item.subtotal.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </SectionCard>

        {/* Totals */}
        <SectionCard title="Resumen">
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>L. {quotation.subtotal.toFixed(2)}</Text>
          </View>
          {quotation.discount && quotation.discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: tokens.colors.error }]}>Descuento</Text>
              <Text style={[styles.summaryValue, { color: tokens.colors.error }]}>- L. {quotation.discount.toFixed(2)}</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ISV (15%)</Text>
            <Text style={styles.summaryValue}>L. {quotation.tax_amount.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>TOTAL</Text>
            <Text style={styles.summaryTotalValue}>L. {quotation.total.toFixed(2)}</Text>
          </View>
        </SectionCard>

        {quotation.notes ? (
          <SectionCard title="Notas">
            <Text style={styles.notesText}>{quotation.notes}</Text>
          </SectionCard>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        {canEdit && (
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.push(`/quotations/edit/${id}` as any)}
          >
            <MaterialCommunityIcons name="pencil-outline" size={16} color={tokens.colors.primary} />
            <Text style={styles.outlineBtnText}>Editar</Text>
          </TouchableOpacity>
        )}
        {canSend && (
          <TouchableOpacity
            style={styles.solidBtn}
            onPress={() => setConfirmAction({ status: 'sent', label: '¿Marcar como enviada?' })}
            disabled={actionLoading}
          >
            <MaterialCommunityIcons name="send-outline" size={16} color="#fff" />
            <Text style={styles.solidBtnText}>Enviar</Text>
          </TouchableOpacity>
        )}
        {canAccept && (
          <TouchableOpacity
            style={[styles.solidBtn, { backgroundColor: tokens.colors.success }]}
            onPress={() => setConfirmAction({ status: 'accepted', label: '¿Aceptar cotización?' })}
            disabled={actionLoading}
          >
            <MaterialCommunityIcons name="check" size={16} color="#fff" />
            <Text style={styles.solidBtnText}>Aceptar</Text>
          </TouchableOpacity>
        )}
        {canReject && (
          <TouchableOpacity
            style={[styles.solidBtn, { backgroundColor: tokens.colors.error }]}
            onPress={() => setConfirmAction({ status: 'cancelled', label: '¿Rechazar cotización?' })}
            disabled={actionLoading}
          >
            <MaterialCommunityIcons name="close" size={16} color="#fff" />
            <Text style={styles.solidBtnText}>Rechazar</Text>
          </TouchableOpacity>
        )}
        {canExpire && (
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: '#D97706' }]}
            onPress={() => setConfirmAction({ status: 'expired', label: '¿Marcar como expirada?' })}
            disabled={actionLoading}
          >
            <MaterialCommunityIcons name="clock-alert-outline" size={16} color="#D97706" />
            <Text style={[styles.outlineBtnText, { color: '#D97706' }]}>Expirar</Text>
          </TouchableOpacity>
        )}
        {canConvert && (
          <TouchableOpacity
            style={[styles.solidBtn, { flex: 1 }]}
            onPress={handleConvertToOrder}
            disabled={actionLoading}
          >
            {actionLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <MaterialCommunityIcons name="cart-arrow-right" size={16} color="#fff" />
                  <Text style={styles.solidBtnText}>Convertir a Pedido</Text>
                </>
            }
          </TouchableOpacity>
        )}
        {canDelete && (
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: tokens.colors.error + '15' }]}
            onPress={() => setConfirmAction({ status: 'cancelled', label: '¿Eliminar cotización?' })}
          >
            <MaterialCommunityIcons name="delete-outline" size={20} color={tokens.colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <ConfirmSheet
        visible={confirmAction !== null}
        title={confirmAction?.label ?? ''}
        message="Esta acción actualizará el estado de la cotización."
        confirmLabel={
          confirmAction?.status === 'cancelled' && canDelete ? 'Eliminar' :
          confirmAction?.status === 'cancelled' ? 'Rechazar' :
          confirmAction?.status === 'expired' ? 'Expirar' :
          confirmAction?.status === 'accepted' ? 'Aceptar' : 'Confirmar'
        }
        destructive={confirmAction?.status === 'cancelled'}
        onConfirm={() => {
          if (!confirmAction) return
          if (confirmAction.status === 'cancelled' && canDelete) {
            handleDelete()
          } else {
            handleStatusChange(confirmAction.status)
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 12,
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
    gap: tokens.spacing.sm,
  },
  headerBack: { padding: 4 },
  headerMid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  headerTitle: { fontSize: tokens.typography.size.lg, fontWeight: '800', color: tokens.colors.gray900 },
  headerAction: { padding: 4 },

  content: { padding: tokens.spacing.md },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoText: { fontSize: tokens.typography.size.base, color: tokens.colors.gray800 },

  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray900 },
  itemSku: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 2 },
  itemPricing: { alignItems: 'flex-end' },
  itemQtyPrice: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray600 },
  itemSubtotal: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.gray900 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray600 },
  summaryValue: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray800 },
  summaryTotal: { borderTopWidth: 1, borderTopColor: tokens.colors.gray100, marginTop: 4, paddingTop: 10 },
  summaryTotalLabel: { fontSize: tokens.typography.size.base, fontWeight: '800', color: tokens.colors.gray900 },
  summaryTotalValue: { fontSize: tokens.typography.size.lg, fontWeight: '800', color: tokens.colors.primary },

  notesText: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray600, lineHeight: 20 },

  bottomBar: {
    flexDirection: 'row',
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.bgLight,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.gray100,
    gap: tokens.spacing.sm,
  },
  solidBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: tokens.radius.lg,
    ...tokens.shadow.sm,
  },
  solidBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: tokens.radius.lg,
    borderWidth: 1.5, borderColor: tokens.colors.primary + '50',
    backgroundColor: tokens.colors.primary + '08',
  },
  outlineBtnText: { color: tokens.colors.primary, fontWeight: '700', fontSize: 13 },
  iconBtn: {
    width: 42, height: 42, borderRadius: tokens.radius.lg,
    justifyContent: 'center', alignItems: 'center',
  },
})
