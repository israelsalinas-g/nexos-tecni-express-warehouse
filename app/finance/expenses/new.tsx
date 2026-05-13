import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ExpenseService,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_COLORS,
} from '@/services/expense.service'
import { DatePickerInput } from '@/components/common/DatePickerInput'
import { tokens } from '@/theme/tokens'
import { Expense, ExpenseCategory } from '@/types/database.types'

const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][]

export default function NewExpenseScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [expenseDate, setExpenseDate] = useState<Date>(new Date())

  useEffect(() => {
    if (!id) return
    ExpenseService.getAll()
      .then(data => {
        const expense = data.find(e => e.id === id)
        if (!expense) { Alert.alert('Error', 'Gasto no encontrado'); router.back(); return }
        setDescription(expense.description)
        setAmount(String(expense.amount))
        setCategory(expense.category)
        setExpenseDate(new Date(expense.expense_date))
      })
      .catch(() => Alert.alert('Error', 'No se pudo cargar el gasto.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    if (!description.trim())         { Alert.alert('Error', 'Ingresa una descripción.'); return }
    const amt = parseFloat(amount)
    if (!amt || amt <= 0)            { Alert.alert('Error', 'Ingresa un monto válido.'); return }

    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${expenseDate.getFullYear()}-${pad(expenseDate.getMonth() + 1)}-${pad(expenseDate.getDate())}`

    setSaving(true)
    try {
      if (isEdit && id) {
        await ExpenseService.update(id, { description: description.trim(), amount: amt, category, expense_date: dateStr })
      } else {
        await ExpenseService.create({ description: description.trim(), amount: amt, category, expense_date: dateStr })
      }
      Alert.alert(isEdit ? 'Actualizado' : 'Registrado', 'Gasto guardado correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch {
      Alert.alert('Error', 'No se pudo guardar el gasto.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={tokens.colors.primary} /></View>
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerClose}>
            <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Editar Gasto' : 'Registrar Gasto'}</Text>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.saveBtnText}>Guardar</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Description */}
          <Text style={styles.label}>Descripción *</Text>
          <TextInput
            style={styles.textField}
            value={description}
            onChangeText={setDescription}
            placeholder="Ej. Pago de alquiler enero"
            placeholderTextColor={tokens.colors.gray400}
          />

          {/* Amount */}
          <Text style={[styles.label, { marginTop: tokens.spacing.md }]}>Monto (L.) *</Text>
          <TextInput
            style={styles.textField}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={tokens.colors.gray400}
          />

          {/* Date */}
          <View style={{ marginTop: tokens.spacing.md }}>
            <DatePickerInput
              label="Fecha del gasto *"
              value={expenseDate}
              onChange={d => { if (d) setExpenseDate(d) }}
            />
          </View>

          {/* Category */}
          <Text style={[styles.label, { marginTop: tokens.spacing.md }]}>Categoría *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(([key, label]) => {
              const color = EXPENSE_CATEGORY_COLORS[key]
              const selected = category === key
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryChip,
                    selected && { backgroundColor: color + '20', borderColor: color },
                  ]}
                  onPress={() => setCategory(key)}
                >
                  <View style={[styles.chipDot, { backgroundColor: color }]} />
                  <Text style={[styles.chipText, selected && { color, fontWeight: '700' }]}>{label}</Text>
                  {selected && <MaterialCommunityIcons name="check" size={14} color={color} />}
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md, paddingVertical: 12,
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100,
  },
  headerClose: { padding: 4 },
  headerTitle: { fontSize: tokens.typography.size.lg, fontWeight: '700', color: tokens.colors.gray900 },
  saveBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: tokens.radius.lg, minWidth: 80, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: tokens.typography.size.base },

  content: { padding: tokens.spacing.md },
  label: { fontSize: tokens.typography.size.sm, fontWeight: '700', color: tokens.colors.gray800, marginBottom: 6 },
  textField: {
    backgroundColor: tokens.colors.bgLight, borderWidth: 1, borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.lg, padding: tokens.spacing.md,
    fontSize: tokens.typography.size.base, color: tokens.colors.gray900,
  },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: tokens.spacing.md, paddingVertical: 8,
    borderRadius: tokens.radius.full,
    borderWidth: 1.5, borderColor: tokens.colors.gray200,
    backgroundColor: tokens.colors.bgLight,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: tokens.typography.size.sm, color: tokens.colors.gray600 },
})
