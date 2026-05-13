import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, RefreshControl, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { FlashList } from '@shopify/flash-list'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { QuotationService } from '@/services/quotation.service'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { tokens } from '@/theme/tokens'
import { Quotation } from '@/types/database.types'

const TABS = [
  { key: 'all',       label: 'Todas' },
  { key: 'draft',     label: 'Borradores' },
  { key: 'sent',      label: 'Enviadas' },
  { key: 'accepted',  label: 'Aceptadas' },
  { key: 'expired',   label: 'Expiradas' },
  { key: 'cancelled', label: 'Canceladas' },
]

export const QUOTATION_STATUS_MAP = {
  draft:     { label: 'Borrador',  color: '#6B7280', bg: '#F3F4F6' },
  sent:      { label: 'Enviada',   color: '#2563EB', bg: '#DBEAFE' },
  accepted:  { label: 'Aceptada',  color: '#059669', bg: '#D1FAE5' },
  expired:   { label: 'Expirada',  color: '#D97706', bg: '#FEF3C7' },
  cancelled: { label: 'Cancelada', color: '#DC2626', bg: '#FEE2E2' },
}

export default function QuotationsScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchQuotations = useCallback(async (status: string) => {
    try {
      setLoading(true)
      const data = await QuotationService.getAll(status)
      setQuotations(data)
    } catch (error) {
      console.error('[QuotationsScreen] Error loading data:', error)
      Alert.alert('Error', 'No se pudieron cargar las cotizaciones.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchQuotations(activeTab) }, [activeTab, fetchQuotations])

  const renderItem = ({ item }: { item: Quotation }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/quotations/${item.id}` as any)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.quotationNo}>#{item.quotation_number}</Text>
          <Text style={styles.date}>
            {item.created_at 
              ? new Date(item.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Fecha no disponible'}
          </Text>
        </View>
        <StatusBadge status={item.status} map={QUOTATION_STATUS_MAP} />
      </View>

      <View style={styles.customerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.customer_name?.charAt(0) ?? 'C'}</Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.customer_name ?? 'Sin cliente'}</Text>
          {item.customer_email ? (
            <Text style={styles.customerEmail}>{item.customer_email}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>L. {(item.total ?? 0).toFixed(2)}</Text>
      </View>

      {item.valid_until && (
        <View style={styles.validRow}>
          <MaterialCommunityIcons name="calendar-clock" size={12} color={tokens.colors.gray400} />
          <Text style={styles.validText}>
            Válida hasta {new Date(item.valid_until).toLocaleDateString('es-HN', { day: '2-digit', month: 'short' })}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Cotizaciones</Text>
        <TouchableOpacity
          style={styles.solidBtn}
          onPress={() => router.push('/quotations/new' as any)}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.solidBtnText}>Nueva</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
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
            data={quotations}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchQuotations(activeTab) }}
                tintColor={tokens.colors.primary}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="file-document-outline"
                title="Sin cotizaciones"
                subtitle={activeTab === 'all' ? 'Aún no hay cotizaciones.' : `No hay cotizaciones en estado "${TABS.find(t => t.key === activeTab)?.label}".`}
                action={{ label: 'Nueva cotización', onPress: () => router.push('/quotations/new' as any) }}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 14,
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  screenTitle: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: tokens.colors.gray900 },
  solidBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.primary,
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
  tabActive: { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary },
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
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: tokens.spacing.sm,
  },
  quotationNo: { fontSize: tokens.typography.size.lg, fontWeight: '800', color: tokens.colors.gray900 },
  date: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 2 },

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.sm },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: tokens.colors.primary + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: tokens.colors.primary, fontWeight: '700', fontSize: 14 },
  customerInfo: { flex: 1 },
  customerName: { fontSize: tokens.typography.size.base, fontWeight: '700', color: tokens.colors.gray900 },
  customerEmail: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray400 },
  totalValue: { fontSize: tokens.typography.size.lg, fontWeight: '800', color: tokens.colors.primary },

  validRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  validText: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400 },
})
