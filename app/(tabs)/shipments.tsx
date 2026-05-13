import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, RefreshControl, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { FlashList } from '@shopify/flash-list'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ShipmentService, ShipmentDetail } from '@/services/shipment.service'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { tokens } from '@/theme/tokens'

const TABS = [
  { key: 'all',        label: 'Todos' },
  { key: 'pending',    label: 'Pendientes' },
  { key: 'dispatched', label: 'Despachados' },
  { key: 'in_transit', label: 'En Tránsito' },
  { key: 'delivered',  label: 'Entregados' },
  { key: 'returned',   label: 'Devueltos' },
]

export const SHIPMENT_STATUS_MAP = {
  pending:    { label: 'Pendiente',    color: '#D97706', bg: '#FEF3C7' },
  dispatched: { label: 'Despachado',   color: '#2563EB', bg: '#DBEAFE' },
  in_transit: { label: 'En Tránsito',  color: '#7C3AED', bg: '#EDE9FE' },
  delivered:  { label: 'Entregado',    color: '#059669', bg: '#D1FAE5' },
  returned:   { label: 'Devuelto',     color: '#DC2626', bg: '#FEE2E2' },
}

export default function ShipmentsScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [shipments, setShipments] = useState<ShipmentDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchShipments = useCallback(async (status: string) => {
    try {
      setLoading(true)
      const data = await ShipmentService.getAll(status)
      setShipments(data)
    } catch (error) {
      console.error('[ShipmentsScreen] Error loading data:', error)
      Alert.alert('Error', 'No se pudieron cargar los envíos.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchShipments(activeTab) }, [activeTab, fetchShipments])

  const renderItem = ({ item }: { item: ShipmentDetail }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/shipments/${item.id}` as any)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.shipmentRef}>
            Envío #{item.id.slice(-6).toUpperCase()}
          </Text>
          <Text style={styles.date}>
            {item.created_at 
              ? new Date(item.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Fecha no disponible'}
          </Text>
        </View>
        <StatusBadge status={item.status} map={SHIPMENT_STATUS_MAP} />
      </View>

      {item.orders && (
        <View style={styles.orderRow}>
          <MaterialCommunityIcons name="receipt-outline" size={14} color={tokens.colors.gray400} />
          <Text style={styles.orderRef}>
            Pedido #{(item.orders as any).order_number}  •  L. {(item.orders as any).total?.toFixed(2)}
          </Text>
        </View>
      )}

      {item.orders && (item.orders as any).profiles && (
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.orders as any).profiles?.full_name?.charAt(0) ?? 'C'}
            </Text>
          </View>
          <Text style={styles.customerName}>
            {(item.orders as any).profiles?.full_name ?? 'Cliente'}
          </Text>
        </View>
      )}

      {item.tracking_number ? (
        <View style={styles.trackingRow}>
          <MaterialCommunityIcons name="truck-outline" size={13} color={tokens.colors.gray400} />
          <Text style={styles.trackingText}>#{item.tracking_number}</Text>
        </View>
      ) : null}

      {item.estimated_delivery ? (
        <View style={styles.trackingRow}>
          <MaterialCommunityIcons name="calendar-check-outline" size={13} color={tokens.colors.gray400} />
          <Text style={styles.trackingText}>
            Est. {new Date(item.estimated_delivery).toLocaleDateString('es-HN', { day: '2-digit', month: 'short' })}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Envíos</Text>
        <TouchableOpacity
          style={styles.solidBtn}
          onPress={() => router.push('/shipments/new' as any)}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.solidBtnText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <FlashList
          data={shipments}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchShipments(activeTab) }}
              tintColor={tokens.colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="truck-fast-outline"
              title="Sin envíos"
              subtitle={activeTab === 'all' ? 'Aún no hay envíos registrados.' : `No hay envíos en estado "${TABS.find(t => t.key === activeTab)?.label}".`}
              action={{ label: 'Nuevo envío', onPress: () => router.push('/shipments/new' as any) }}
            />
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  screenHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: tokens.spacing.md, paddingVertical: 14,
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100,
  },
  screenTitle: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: tokens.colors.gray900 },
  solidBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: tokens.radius.lg, backgroundColor: '#f59e0b',
    ...tokens.shadow.sm,
  },
  solidBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  tabs: { paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm, gap: tokens.spacing.sm },
  tab: {
    paddingHorizontal: tokens.spacing.md, paddingVertical: 7,
    borderRadius: tokens.radius.full,
    borderWidth: 1.5, borderColor: tokens.colors.gray200,
    backgroundColor: tokens.colors.bgLight,
  },
  tabActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  tabText: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray600 },
  tabTextActive: { color: '#fff' },

  list: { padding: tokens.spacing.md, paddingBottom: 40 },

  card: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    ...tokens.shadow.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tokens.spacing.sm },
  shipmentRef: { fontSize: tokens.typography.size.base, fontWeight: '800', color: tokens.colors.gray900 },
  date: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 2 },

  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: tokens.spacing.xs },
  orderRef: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray600 },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.xs },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#f59e0b20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#f59e0b', fontWeight: '700', fontSize: 11 },
  customerName: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray800 },

  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  trackingText: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, fontFamily: 'monospace' },
})
