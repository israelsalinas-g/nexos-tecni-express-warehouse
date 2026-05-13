import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator, TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { FlashList } from '@shopify/flash-list'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PayableService } from '@/services/payable.service'
import { BottomSheet } from '@/components/common/BottomSheet'
import { DatePickerInput } from '@/components/common/DatePickerInput'
import { tokens } from '@/theme/tokens'
import { PurchaseOrderWithPaid } from '@/types/database.types'

export default function PayablesScreen() {
  const router = useRouter()
  const [orders, setOrders] = useState<PurchaseOrderWithPaid[]>([])
  const [totalPending, setTotalPending] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [paySheet, setPaySheet] = useState<{ order: PurchaseOrderWithPaid } | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState<Date>(new Date())
  const [payRef, setPayRef] = useState('')
  const [paying, setPaying] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const data = await PayableService.getUnpaidOrders()
      const withPending = data.filter(o => (o.total_amount ?? 0) - o.paid_total > 0)
      setOrders(withPending)
      setTotalPending(withPending.reduce((s, o) => s + Math.max(0, (o.total_amount ?? 0) - o.paid_total), 0))
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las cuentas por pagar.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openPaySheet = (order: PurchaseOrderWithPaid) => {
    const pending = Math.max(0, (order.total_amount ?? 0) - order.paid_total)
    setPayAmount(pending.toFixed(2))
    setPayDate(new Date())
    setPayRef('')
    setPaySheet({ order })
  }

  const handlePay = async () => {
    if (!paySheet) return
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) { Alert.alert('Error', 'Ingresa un monto válido.'); return }

    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${payDate.getFullYear()}-${pad(payDate.getMonth() + 1)}-${pad(payDate.getDate())}`

    setPaying(true)
    try {
      await PayableService.registerPayment({
        purchase_order_id: paySheet.order.id,
        amount,
        payment_date: dateStr,
        reference: payRef.trim() || undefined,
      })
      Alert.alert('Pago registrado', 'El pago fue registrado correctamente.')
      setPaySheet(null)
      fetchData()
    } catch {
      Alert.alert('Error', 'No se pudo registrar el pago.')
    } finally {
      setPaying(false)
    }
  }

  const renderItem = ({ item }: { item: PurchaseOrderWithPaid }) => {
    const pending = Math.max(0, (item.total_amount ?? 0) - item.paid_total)
    const paidPct = item.total_amount ? (item.paid_total / item.total_amount) * 100 : 0

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.poNumber}>OC #{item.po_number}</Text>
            <Text style={styles.supplierName}>{(item as any).suppliers?.name ?? 'Proveedor'}</Text>
          </View>
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => openPaySheet(item)}
          >
            <MaterialCommunityIcons name="cash-plus" size={14} color="#fff" />
            <Text style={styles.payBtnText}>Pagar</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.min(100, paidPct)}%` as any }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressPaid}>Pagado: L. {item.paid_total.toLocaleString('es-HN', { minimumFractionDigits: 0 })}</Text>
          <Text style={styles.progressPending}>Pendiente: L. {pending.toLocaleString('es-HN', { minimumFractionDigits: 0 })}</Text>
        </View>

        <Text style={styles.totalText}>
          Total OC: L. {(item.total_amount ?? 0).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cuentas por Pagar</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={tokens.colors.primary} /></View>
      ) : (
        <>
          <View style={styles.banner}>
            <View>
              <Text style={styles.bannerLabel}>Total pendiente</Text>
              <Text style={styles.bannerTotal}>
                L. {totalPending.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View>
              <Text style={styles.bannerLabel}>OC por pagar</Text>
              <Text style={styles.bannerCount}>{orders.length}</Text>
            </View>
          </View>

          <FlashList
            data={orders}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData() }} tintColor={tokens.colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="check-circle-outline" size={56} color={tokens.colors.gray200} />
                <Text style={styles.emptyTitle}>Sin cuentas pendientes</Text>
                <Text style={styles.emptySub}>Todas las órdenes de compra están pagadas.</Text>
              </View>
            }
          />
        </>
      )}

      {/* Payment bottom sheet */}
      <BottomSheet
        visible={paySheet !== null}
        onClose={() => setPaySheet(null)}
        title={`Registrar Pago — OC #${paySheet?.order.po_number}`}
        height="70%"
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetLabel}>Monto a pagar (L.) *</Text>
          <TextInput
            style={styles.sheetInput}
            value={payAmount}
            onChangeText={setPayAmount}
            keyboardType="decimal-pad"
            selectTextOnFocus
            placeholder="0.00"
            placeholderTextColor={tokens.colors.gray400}
          />

          <View style={{ marginTop: tokens.spacing.md }}>
            <DatePickerInput label="Fecha de pago *" value={payDate} onChange={d => { if (d) setPayDate(d) }} />
          </View>

          <Text style={[styles.sheetLabel, { marginTop: tokens.spacing.md }]}>Referencia / Cheque</Text>
          <TextInput
            style={styles.sheetInput}
            value={payRef}
            onChangeText={setPayRef}
            placeholder="Opcional"
            placeholderTextColor={tokens.colors.gray400}
          />

          <TouchableOpacity
            style={[styles.sheetSaveBtn, paying && { opacity: 0.6 }]}
            onPress={handlePay}
            disabled={paying}
          >
            {paying
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.sheetSaveBtnText}>Confirmar Pago</Text>
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
  headerTitle: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: tokens.colors.gray900 },

  banner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    margin: tokens.spacing.md,
    backgroundColor: '#f59e0b15',
    borderRadius: tokens.radius.lg, padding: tokens.spacing.md,
    borderWidth: 1, borderColor: '#f59e0b30',
  },
  bannerLabel: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray600 },
  bannerTotal: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: '#f59e0b' },
  bannerCount: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: '#f59e0b', textAlign: 'right' },

  list: { padding: tokens.spacing.md, paddingTop: 0, paddingBottom: 40 },

  card: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl, padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    ...tokens.shadow.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tokens.spacing.sm },
  poNumber: { fontSize: tokens.typography.size.base, fontWeight: '800', color: tokens.colors.gray900 },
  supplierName: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray600, marginTop: 2 },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: tokens.radius.lg,
  },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  progressBg: { height: 6, backgroundColor: tokens.colors.gray100, borderRadius: 3, marginBottom: 4 },
  progressFill: { height: 6, backgroundColor: '#f59e0b', borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressPaid: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray600 },
  progressPending: { fontSize: tokens.typography.size.xs, color: '#f59e0b', fontWeight: '700' },
  totalText: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: tokens.typography.size.lg, fontWeight: '700', color: tokens.colors.gray600, marginTop: 12 },
  emptySub: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray400, marginTop: 4 },

  sheetContent: { paddingHorizontal: tokens.spacing.md },
  sheetLabel: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.gray800, marginBottom: 6 },
  sheetInput: {
    backgroundColor: tokens.colors.bgScreen, borderWidth: 1, borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.lg, padding: tokens.spacing.md,
    fontSize: tokens.typography.size.base, color: tokens.colors.gray900,
  },
  sheetSaveBtn: {
    marginTop: 20, backgroundColor: '#f59e0b',
    borderRadius: tokens.radius.lg, paddingVertical: 13, alignItems: 'center',
  },
  sheetSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: tokens.typography.size.base },
})
