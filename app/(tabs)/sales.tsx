import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OrderService } from '@/services/order.service'
import { tokens } from '@/theme/tokens'

export default function SalesScreen() {
  const router = useRouter()
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true)
      const data = await OrderService.getPendingOrders()
      setSales(data)
    } catch (e) {
      console.error(e)
      Alert.alert('Error', 'No se pudieron cargar las ventas.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  const onRefresh = () => {
    setRefreshing(true)
    fetchSales()
  }

  const handleConfirmPayment = (orderId: string) => {
    router.push(`/invoices/new?fromOrderId=${orderId}` as any)
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderNo}>#{item.order_number}</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('es-HN')}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.payment_status === 'paid' ? tokens.colors.success + '20' : tokens.colors.warning + '20' }]}>
          <Text style={[styles.statusText, { color: item.payment_status === 'paid' ? tokens.colors.success : tokens.colors.warning }]}>
            {item.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE PAGO'}
          </Text>
        </View>
      </View>
      
      <View style={styles.customerBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.profiles?.full_name?.charAt(0) || 'C'}</Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.profiles?.full_name || 'Cliente Final'}</Text>
          <Text style={styles.customerPhone}>{item.profiles?.phone || 'Sin teléfono'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.whatsappBtn}
          onPress={() => Alert.alert('WhatsApp', 'Abriendo conversación con el cliente...')}
        >
          <MaterialCommunityIcons name="whatsapp" size={20} color={tokens.colors.success} />
        </TouchableOpacity>
      </View>

      <View style={styles.itemsList}>
        {item.order_items?.map((idx: any, i: number) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>{idx.product_name_es}</Text>
            <Text style={styles.itemQty}>x{idx.quantity}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total (incl. 15% ISV)</Text>
          <Text style={styles.totalValue}>L. {item.total?.toFixed(2)}</Text>
        </View>
        
        {item.payment_status !== 'paid' && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleConfirmPayment(item.id)}
          >
            <MaterialCommunityIcons name="receipt-outline" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Facturar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Gestión de Ventas</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.newSaleBtn, styles.invoiceBtn]}
            onPress={() => router.push('/invoices/new' as any)}
          >
            <MaterialCommunityIcons name="receipt-text-outline" size={18} color={tokens.colors.primary} />
            <Text style={styles.invoiceBtnText}>Factura</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newSaleBtn}
            onPress={() => router.push('/sales/new' as any)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            <Text style={styles.newSaleBtnText}>Nueva</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sales}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="cash-remove" size={64} color={tokens.colors.gray100} />
              <Text style={styles.emptyText}>No hay ventas pendientes de procesar</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  screenTitle: { fontSize: 24, fontWeight: '800', color: tokens.colors.gray900 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  newSaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
    ...tokens.shadow.sm,
  },
  newSaleBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  invoiceBtn: {
    backgroundColor: tokens.colors.primary + '12',
    borderWidth: 1,
    borderColor: tokens.colors.primary + '40',
  },
  invoiceBtnText: { color: tokens.colors.primary, fontWeight: '700', fontSize: 13 },
  list: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...tokens.shadow.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNo: { fontSize: 18, fontWeight: '800', color: tokens.colors.gray900 },
  date: { fontSize: 12, color: tokens.colors.gray400, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  customerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.gray50,
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: tokens.colors.primary, fontWeight: '700', fontSize: 16 },
  customerInfo: { flex: 1, marginLeft: 12 },
  customerName: { fontSize: 15, fontWeight: '700', color: tokens.colors.gray800 },
  customerPhone: { fontSize: 12, color: tokens.colors.gray400, marginTop: 2 },
  whatsappBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...tokens.shadow.sm,
  },
  itemsList: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray50,
    paddingBottom: 16,
    marginBottom: 16,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName: { fontSize: 13, color: tokens.colors.gray600, flex: 1 },
  itemQty: { fontSize: 13, fontWeight: '700', color: tokens.colors.gray900, marginLeft: 12 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalBox: { flex: 1 },
  totalLabel: { fontSize: 11, color: tokens.colors.gray400, textTransform: 'uppercase' },
  totalValue: { fontSize: 20, fontWeight: '900', color: tokens.colors.primary, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    ...tokens.shadow.sm,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: tokens.colors.gray400, marginTop: 16, fontSize: 15, textAlign: 'center' },
})
