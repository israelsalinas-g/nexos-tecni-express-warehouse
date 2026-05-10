import { useEffect, useState, useCallback } from 'react'
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { PurchaseOrderService } from '@/services/purchase-order.service'
import { PurchaseOrder } from '@/types/database.types'

export default function PurchasesScreen() {
  const router = useRouter()
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await PurchaseOrderService.getAll()
      setPurchases(data)
    } catch (error) {
      console.error('Error loading purchases:', error)
      Alert.alert('Error', 'No se pudieron cargar las órdenes de compra.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return tokens.colors.success
      case 'pending': return tokens.colors.warning
      case 'cancelled': return tokens.colors.error
      default: return tokens.colors.gray400
    }
  }

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/purchases/${item.id}` as any)}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.poNumber}>OC #{item.po_number}</Text>
          <Text style={styles.supplierName}>{item.suppliers?.name || 'Proveedor Desconocido'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="warehouse" size={16} color={tokens.colors.gray400} />
          <Text style={styles.infoText}>{item.warehouses?.name || 'Bodega General'}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={16} color={tokens.colors.gray400} />
          <Text style={styles.infoText}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.totalLabel}>Total Estimado:</Text>
        <Text style={styles.totalValue}>L. {item.total_amount?.toFixed(2) || '0.00'}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Compras</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/purchases/new' as any)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={purchases}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="cart-off" size={64} color={tokens.colors.gray200} />
              <Text style={styles.emptyText}>No hay órdenes de compra registradas</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.bgScreen,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: tokens.colors.gray900,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: tokens.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...tokens.shadow.sm,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...tokens.shadow.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  poNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: tokens.colors.gray900,
  },
  supplierName: {
    fontSize: 14,
    color: tokens.colors.gray400,

    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: tokens.colors.gray50,
    paddingTop: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: tokens.colors.gray600,
  },
  cardFooter: {
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.gray50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: tokens.colors.gray400,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: tokens.colors.gray400,
    textAlign: 'center',
  }
})
