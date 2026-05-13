import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { FlashList } from '@shopify/flash-list'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ExpenseService,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_COLORS,
  CategorySummary,
} from '@/services/expense.service'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { PeriodFilter } from '@/components/common/PeriodFilter'
import { tokens } from '@/theme/tokens'
import { Expense, ExpenseCategory } from '@/types/database.types'

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'all', label: 'Todas' },
  ...Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => ({ key, label })),
]

export default function ExpensesScreen() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summaries, setSummaries] = useState<CategorySummary[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('month')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchData = useCallback(async (cat: string, per: typeof period) => {
    try {
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

      let from: string
      let to = iso(now)

      if (per === 'today')   from = iso(now)
      else if (per === 'week') {
        const s = new Date(now); s.setDate(now.getDate() - now.getDay()); from = iso(s)
      } else if (per === 'month') {
        from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
      } else {
        const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        from = iso(qStart)
      }

      const [data, cats] = await Promise.all([
        ExpenseService.getAll({
          category: cat !== 'all' ? cat as ExpenseCategory : undefined,
          from,
          to,
        }),
        ExpenseService.getSummaryByCategory(from, to),
      ])

      setExpenses(data)
      setSummaries(cats)
      setTotal(data.reduce((s, e) => s + e.amount, 0))
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los gastos.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData(activeCategory, period) }, [activeCategory, period, fetchData])

  const handleDelete = async (id: string) => {
    try {
      await ExpenseService.delete(id)
      setExpenses(prev => prev.filter(e => e.id !== id))
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el gasto.')
    } finally {
      setConfirmDelete(null)
    }
  }

  const renderItem = ({ item }: { item: Expense }) => {
    const color = EXPENSE_CATEGORY_COLORS[item.category]
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/finance/expenses/new?id=${item.id}` as any)}
        activeOpacity={0.8}
      >
        <View style={[styles.categoryDot, { backgroundColor: color }]} />
        <View style={styles.cardBody}>
          <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.categoryLabel}>{EXPENSE_CATEGORY_LABELS[item.category]}</Text>
          <Text style={styles.dateText}>
            {new Date(item.expense_date).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.amount}>L. {item.amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => setConfirmDelete(item.id)}>
            <MaterialCommunityIcons name="delete-outline" size={16} color={tokens.colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gastos</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/finance/expenses/new' as any)}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Period filter */}
      <PeriodFilter value={period} onChange={v => { if (v !== 'custom') setPeriod(v as any) }} />

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.tab, activeCategory === cat.key && styles.tabActive]}
            onPress={() => setActiveCategory(cat.key)}
          >
            <Text style={[styles.tabText, activeCategory === cat.key && styles.tabTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : (
        <>
          {/* Summary banner */}
          <View style={styles.summaryBanner}>
            <View>
              <Text style={styles.summaryLabel}>Total del período</Text>
              <Text style={styles.summaryTotal}>
                L. {total.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <Text style={styles.summaryCount}>{expenses.length} registros</Text>
          </View>

          {/* Category chips with totals */}
          {summaries.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryChips}>
              {summaries.map(s => (
                <TouchableOpacity
                  key={s.category}
                  style={[styles.chip, { borderColor: EXPENSE_CATEGORY_COLORS[s.category] + '60' }]}
                  onPress={() => setActiveCategory(s.category)}
                >
                  <View style={[styles.chipDot, { backgroundColor: EXPENSE_CATEGORY_COLORS[s.category] }]} />
                  <View>
                    <Text style={styles.chipLabel}>{EXPENSE_CATEGORY_LABELS[s.category]}</Text>
                    <Text style={[styles.chipTotal, { color: EXPENSE_CATEGORY_COLORS[s.category] }]}>
                      L. {s.total.toLocaleString('es-HN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <FlashList
            data={expenses}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchData(activeCategory, period) }}
                tintColor={tokens.colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="receipt-text-outline" size={48} color={tokens.colors.gray200} />
                <Text style={styles.emptyTitle}>Sin gastos</Text>
                <Text style={styles.emptySub}>No hay gastos registrados para este período.</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/finance/expenses/new' as any)}>
                  <Text style={styles.emptyBtnText}>Registrar gasto</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </>
      )}

      <ConfirmSheet
        visible={confirmDelete !== null}
        title="Eliminar gasto"
        message="¿Seguro que quieres eliminar este registro? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => { if (confirmDelete) handleDelete(confirmDelete) }}
        onCancel={() => setConfirmDelete(null)}
      />
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
  headerTitle: { flex: 1, fontSize: tokens.typography.size.xl, fontWeight: '800', color: tokens.colors.gray900 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center',
  },

  tabs: { paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm, gap: tokens.spacing.sm },
  tab: {
    paddingHorizontal: tokens.spacing.md, paddingVertical: 7,
    borderRadius: tokens.radius.full,
    borderWidth: 1.5, borderColor: tokens.colors.gray200,
    backgroundColor: tokens.colors.bgLight,
  },
  tabActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  tabText: { fontSize: tokens.typography.size.sm, fontWeight: '600', color: tokens.colors.gray600 },
  tabTextActive: { color: '#fff' },

  summaryBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: tokens.spacing.md, marginTop: tokens.spacing.sm,
    backgroundColor: '#ef444415',
    borderRadius: tokens.radius.lg, padding: tokens.spacing.md,
    borderWidth: 1, borderColor: '#ef444430',
  },
  summaryLabel: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray600 },
  summaryTotal: { fontSize: tokens.typography.size.xl, fontWeight: '800', color: '#ef4444' },
  summaryCount: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray400 },

  summaryChips: { paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm, gap: tokens.spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 6,
    ...tokens.shadow.sm,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipLabel: { fontSize: 10, color: tokens.colors.gray600, fontWeight: '600' },
  chipTotal: { fontSize: tokens.typography.size.xs, fontWeight: '800' },

  list: { padding: tokens.spacing.md, paddingBottom: 40 },

  card: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl, padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm,
    ...tokens.shadow.sm,
  },
  categoryDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  cardBody: { flex: 1 },
  description: { fontSize: tokens.typography.size.base, fontWeight: '600', color: tokens.colors.gray900 },
  categoryLabel: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray600, marginTop: 2 },
  dateText: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray400, marginTop: 1 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: tokens.typography.size.base, fontWeight: '800', color: '#ef4444' },
  deleteBtn: { padding: 2 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: tokens.typography.size.lg, fontWeight: '700', color: tokens.colors.gray600, marginTop: 12 },
  emptySub: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray400, marginTop: 4 },
  emptyBtn: { marginTop: 16, backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 10, borderRadius: tokens.radius.lg },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: tokens.typography.size.sm },
})
