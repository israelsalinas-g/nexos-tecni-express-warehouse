import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'

interface Props {
  value: Date | null
  onChange: (date: Date) => void
  label: string
  placeholder?: string
  minimumDate?: Date
  maximumDate?: Date
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-HN', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function DatePickerInput({ value, onChange, label, placeholder = 'Seleccionar fecha', minimumDate, maximumDate }: Props) {
  const [show, setShow] = useState(false)

  const handleChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false)
    if (selected) onChange(selected)
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShow(true)} activeOpacity={0.7}>
        <Text style={[styles.valueText, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <MaterialCommunityIcons name="calendar-outline" size={18} color={tokens.colors.gray400} />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onTouchCancel={() => setShow(false)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: tokens.spacing.md,
  },
  label: {
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
    color: tokens.colors.gray600,
    marginBottom: 6,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 12,
    backgroundColor: tokens.colors.bgLight,
  },
  valueText: {
    fontSize: tokens.typography.size.base,
    color: tokens.colors.gray900,
  },
  placeholder: {
    color: tokens.colors.gray400,
  },
})
