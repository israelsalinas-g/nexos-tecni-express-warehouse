import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert,
} from 'react-native'
import { Link } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { TransferService } from '@/services/transfer.service'
import { ReceiveTransferUseCase } from '@/core/use-cases/receive-transfer.use-case'
import { tokens } from '@/theme/tokens'

export default function TransfersScreen() {
  const [transfers, setTransfers]     = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await TransferService.getByWarehouse('all')
      setTransfers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function onRefresh() {
    setRefreshing(true)
    await loadData()
  }

  async function handleReceive(transferId: string) {
    Alert.alert('Confirmar recepción', '¿Confirmar que has recibido los productos físicamente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Recibir',
        onPress: async () => {
          try {
            const useCase = new ReceiveTransferUseCase()
            await useCase.execute({ transferId, receivedBy: 'user-id' })
            Alert.alert('Éxito', 'Traslado recibido correctamente.')
            loadData()
          } catch (e: any) {
            Alert.alert('Error', e.message)
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Traslados</Text>
        <Link href="/transfers/new" asChild>
          <TouchableOpacity 
            style={styles.newBtn}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Nuevo traslado"
          >
            <MaterialCommunityIcons name="plus" size={24} color={tokens.colors.bgLight} />
          </TouchableOpacity>
        </Link>
      </View>

      <FlatList
        data={transfers}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[tokens.colors.primary]}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="swap-horizontal" size={48} color={tokens.colors.gray200} />
            <Text style={styles.emptyText}>No hay traslados activos.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <View style={[
                  styles.statusBadge, 
                  item.status === 'received' && styles.statusBadgeSuccess
                ]}>
                  <Text style={[
                    styles.statusText,
                    item.status === 'received' && styles.statusTextSuccess
                  ]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.transferNo}>#{item.id.slice(0, 8)}</Text>
              </View>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>

            <View style={styles.route}>
              <View style={styles.warehouseBox}>
                <Text style={styles.warehouseLabel}>Origen</Text>
                <Text style={styles.warehouseName} numberOfLines={1}>
                  {item.from?.name || 'Bodega A'}
                </Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={20} color={tokens.colors.gray400} />
              <View style={styles.warehouseBox}>
                <Text style={styles.warehouseLabel}>Destino</Text>
                <Text style={styles.warehouseName} numberOfLines={1}>
                  {item.to?.name || 'Bodega B'}
                </Text>
              </View>
            </View>

            {item.status !== 'received' && (
              <TouchableOpacity 
                style={styles.receiveBtn} 
                onPress={() => handleReceive(item.id)}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Marcar como recibido"
              >
                <Text style={styles.receiveBtnText}>Marcar como recibido</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: tokens.spacing[4], 
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray200,
    ...tokens.shadow.sm,
  },
  title: { 
    fontSize: tokens.typography.size.xl, 
    fontWeight: tokens.typography.weight.extrabold, 
    color: tokens.colors.gray900 
  },
  newBtn: { 
    backgroundColor: tokens.colors.primary, 
    borderRadius: tokens.radius.lg, 
    padding: tokens.spacing[2] 
  },
  list: { padding: tokens.spacing[4], paddingBottom: tokens.spacing[10] },
  emptyContainer: { alignItems: 'center', marginTop: tokens.spacing[12] },
  emptyText: { color: tokens.colors.gray400, marginTop: tokens.spacing[3], fontSize: tokens.typography.size.base },
  card: { 
    backgroundColor: tokens.colors.bgLight, 
    borderRadius: tokens.radius.xl, 
    padding: tokens.spacing[4], 
    marginBottom: tokens.spacing[4],
    ...tokens.shadow.md,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: tokens.spacing[4] 
  },
  statusBadge: { 
    backgroundColor: tokens.colors.gray100, 
    paddingHorizontal: tokens.spacing[2], 
    paddingVertical: 4, 
    borderRadius: tokens.radius.md,
    alignSelf: 'flex-start',
    marginBottom: tokens.spacing[1]
  },
  statusBadgeSuccess: { backgroundColor: tokens.colors.success + '20' }, // 20% opacity
  statusText: { 
    fontSize: tokens.typography.size.xs, 
    fontWeight: tokens.typography.weight.extrabold, 
    color: tokens.colors.gray600 
  },
  statusTextSuccess: { color: tokens.colors.success },
  transferNo: { 
    fontSize: tokens.typography.size.base, 
    fontWeight: tokens.typography.weight.bold, 
    color: tokens.colors.gray900 
  },
  date: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray400 },
  route: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.gray50,
    padding: tokens.spacing[3],
    borderRadius: tokens.radius.lg,
    marginBottom: tokens.spacing[4]
  },
  warehouseBox: { flex: 1 },
  warehouseLabel: { 
    fontSize: 10, 
    color: tokens.colors.gray400, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  warehouseName: { 
    fontSize: tokens.typography.size.base, 
    fontWeight: tokens.typography.weight.semibold, 
    color: tokens.colors.gray800 
  },
  receiveBtn: { 
    backgroundColor: tokens.colors.success, 
    borderRadius: tokens.radius.lg, 
    paddingVertical: tokens.spacing[3], 
    alignItems: 'center' 
  },
  receiveBtnText: { 
    color: tokens.colors.bgLight, 
    fontSize: tokens.typography.size.base, 
    fontWeight: tokens.typography.weight.bold 
  },
})


