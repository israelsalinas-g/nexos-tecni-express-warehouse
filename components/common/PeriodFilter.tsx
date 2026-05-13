import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { DatePickerInput } from './DatePickerInput'
import { tokens } from '@/theme/tokens'

export type PeriodValue = 'today' | 'week' | 'month' | 'quarter' | 'custom'

export interface DateRange {
  from: Date
  to: Date
}

interface Props {
  value: PeriodValue
  onChange: (period: PeriodValue, range: DateRange) => void
}

const OPTIONS: { value: PeriodValue; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'custom', label: 'Personalizado' },
]

function getRange(period: PeriodValue, customFrom?: Date, customTo?: Date): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (period) {
    case 'today':
      return { from: today, to: now }
    case 'week': {
      const start = new Date(today)
      start.setDate(today.getDate() - 6)
      return { from: start, to: now }
    }
    case 'month': {
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now }
    }
    case 'quarter': {
      return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to: now }
    }
    case 'custom':
      return { from: customFrom ?? today, to: customTo ?? now }
  }
}

export function PeriodFilter({ value, onChange }: Props) {
  const [customFrom, setCustomFrom] = useState<Date | null>(null)
  const [customTo, setCustomTo] = useState<Date | null>(null)

  const handleSelect = (period: PeriodValue) => {
    const range = getRange(period, customFrom ?? undefined, customTo ?? undefined)
    onChange(period, range)
  }

  const handleCustomDate = (field: 'from' | 'to', date: Date) => {
    const from = field === 'from' ? date : (customFrom ?? new Date())
    const to = field === 'to' ? date : (customTo ?? new Date())
    if (field === 'from') setCustomFrom(date)
    if (field === 'to') setCustomTo(date)
    onChange('custom', { from, to })
  }

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, value === opt.value && styles.chipActive]}
            onPress={() => handleSelect(opt.value)}
          >
            <Text style={[styles.chipText, value === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {value === 'custom' && (
        <View style={styles.customRow}>
          <View style={styles.customField}>
            <DatePickerInput
              label="Desde"
              value={customFrom}
              onChange={d => handleCustomDate('from', d)}
              maximumDate={customTo ?? undefined}
            />
          </View>
          <View style={styles.customField}>
            <DatePickerInput
              label="Hasta"
              value={customTo}
              onChange={d => handleCustomDate('to', d)}
              minimumDate={customFrom ?? undefined}
            />
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  },
  chip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 7,
    borderRadius: tokens.radius.full,
    borderWidth: 1.5,
    borderColor: tokens.colors.gray200,
    backgroundColor: tokens.colors.bgLight,
  },
  chipActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  chipText: {
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
    color: tokens.colors.gray600,
  },
  chipTextActive: {
    color: '#fff',
  },
  customRow: {
    flexDirection: 'row',
    paddingHorizontal: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  customField: {
    flex: 1,
  },
})
