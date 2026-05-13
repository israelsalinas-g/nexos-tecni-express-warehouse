import { useState, useMemo, ReactNode } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { BottomSheet } from './BottomSheet'
import { tokens } from '@/theme/tokens'

interface Props<T> {
  label: string
  placeholder?: string
  data: T[]
  value: T | null
  onSelect: (item: T) => void
  searchKey: keyof T
  renderItem: (item: T) => ReactNode
  renderSelected?: (item: T) => string
  loading?: boolean
  disabled?: boolean
}

export function SearchableSelector<T extends { id: string }>({
  label,
  placeholder = 'Buscar...',
  data,
  value,
  onSelect,
  searchKey,
  renderItem,
  renderSelected,
  loading = false,
  disabled = false,
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return data
    const q = query.toLowerCase()
    return data.filter(item => String(item[searchKey]).toLowerCase().includes(q))
  }, [data, query, searchKey])

  const displayValue = value
    ? (renderSelected ? renderSelected(value) : String(value[searchKey]))
    : null

  return (
    <>
      <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={[styles.selector, disabled && styles.disabled]}
          onPress={() => !disabled && setOpen(true)}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color={tokens.colors.primary} />
          ) : (
            <>
              <Text style={[styles.valueText, !displayValue && styles.placeholderText]}>
                {displayValue ?? placeholder}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={tokens.colors.gray400} />
            </>
          )}
        </TouchableOpacity>
      </View>

      <BottomSheet visible={open} onClose={() => { setOpen(false); setQuery('') }} title={label} height="70%">
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color={tokens.colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            placeholderTextColor={tokens.colors.gray400}
            autoFocus
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.option, value?.id === item.id && styles.optionSelected]}
              onPress={() => { onSelect(item); setOpen(false); setQuery('') }}
            >
              {renderItem(item)}
              {value?.id === item.id && (
                <MaterialCommunityIcons name="check" size={18} color={tokens.colors.primary} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Sin resultados</Text>
          }
        />
      </BottomSheet>
    </>
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
  selector: {
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
  disabled: {
    opacity: 0.5,
  },
  valueText: {
    fontSize: tokens.typography.size.base,
    color: tokens.colors.gray900,
    flex: 1,
  },
  placeholderText: {
    color: tokens.colors.gray400,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: tokens.spacing.md,
    backgroundColor: tokens.colors.gray100,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.sm,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: tokens.typography.size.base,
    color: tokens.colors.gray900,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  optionSelected: {
    backgroundColor: tokens.colors.gray50,
  },
  empty: {
    textAlign: 'center',
    color: tokens.colors.gray400,
    padding: tokens.spacing.lg,
  },
})
