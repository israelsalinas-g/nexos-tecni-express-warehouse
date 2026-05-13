import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator, Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { FlashList } from '@shopify/flash-list'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { tokens } from '@/theme/tokens'

interface ReceivableRow {
  account_id: string
  customer_name: string
  customer_phone?: string
  pending_balance: number
  oldest_charge?: string
}

export default function ReceivablesScreen() {
  const router = useRouter()
  const [rows, setRows] = useState<ReceivableRow[]>([])
  const [totalPending, setTotalPending] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      // Load unpaid credit charges grouped by account
      const { data, error } = await supabase
        .from('credit_transactions')
        .select(`
          account_id, amount, created_at,
          credit_accounts(
            id, customer_id,
            profiles(full_name, phone)
          )
        `)
        .eq('transaction_type', 'charge')
        .is('paid_at', null)
        .order('created_at', { ascending: true })

      if (error) throw error

      const map: Record<string, ReceivableRow> = {}
      for (const tx of (data ?? []) as any[]) {
        const acct = tx.credit_accounts
        if (!acct) continue
        const key = tx.account_id
        if (!map[key]) {
          map[key] = {
            account_id: key,
            customer_name: acct.profiles?.full_name ?? 'Cliente',
            customer_phone: acct.profiles?.phone,
            pending_balance: 0,
            oldest_charge: tx.created_at,
          }
        }
        map[key].pending_balance += tx.amount
      }

      const result = Object.values(map).sort((a, b) => b.pending_balance - a.pending_balance)
      setRows(result)
      setTotalPending(result.reduce((s, r) => s + r.pending_balance, 0))
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las cuentas por cobrar.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const renderItem = ({ item }: { item: ReceivableRow }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/credit/${item.account_id}` as any)}
      activeOpacity={0.8}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.customer_name.charAt(0)}</Text>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        {item.oldest_charge && (
          <Text style={styles.dateText}>
            Desde {new Date(item.oldest_charge).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
        )}
      </View>

      <View style={styles.cardRight}>
        <Text style={styles.balance}>L. {item.pending_balance.toLocaleString('es-HN', { minimumFractionDigits: 2 })}</Text>
        {item.customer_phone && (
          <TouchableOpacity
            style={styles.waBtn}
            onPress={() => Linking.openURL(`https://wa.me/504${item.customer_phone!.replace(/\D/g, '')}`)}
          >
            <MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cuentas por Cobrar</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <>
          {/* Summary banner */}
          <View style={styles.banner}>
            <View>
              <Text style={styles.bannerLabel}>Total pendiente</Text>
              <Text style={styles.bannerTotal}>
                L. {totalPending.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View>
              <Text style={styles.bannerLabel}>Clientes deudores</Text>
              <Text style={styles.bannerCount}>{rows.length}</Text>
            </View>
          </View>

          <FlashList
            data={rows}
            renderItem={renderItem}
            keyExtractor={item => item.account_id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData() }} tintColor={tokens.colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="check-circle-outline" size={56} color={tokens.colors.gray200} />
                <Text style={styles.emptyTitle}>¡Sin deudas pendientes!</Text>
                <Text style={styles.emptySub}>Todos los clientes están al corriente.</Text>
              </View>
            }
          />
        </>
      )}
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
    backgroundColor: '#3b82f615',
    borderRadius: tokens.radius.lg, padding: tokens.spacing.md,
    borderWidth: 1, borderColor: '#3b82f630',
  },
  bannerLabel: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray600 },
  bannerTotal: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: '#3b82f6' },
  bannerCount: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: '#3b82f6', textAlign: 'right' },

  list: { padding: tokens.spacing.md, paddingTop: 0, paddingBottom: 40 },

  card: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl, padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm,
    ...tokens.shadow.sm,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f620', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#3b82f6', fontWeight: '700', fontSize: 16 },
  cardInfo: { flex: 1 },
  customerName: { fontSize: tokens.typography.size.base, fontWeight: '700', color: tokens.colors.gray900 },
  dateText: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  balance: { fontSize: tokens.typography.size.base, fontWeight: '800', color: '#3b82f6' },
  waBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E9FBF0', justifyContent: 'center', alignItems: 'center' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: tokens.typography.size.lg, fontWeight: '700', color: tokens.colors.gray600, marginTop: 12 },
  emptySub: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray400, marginTop: 4 },
})
