import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'

export interface LineItem {
  id: string
  name: string
  sku?: string
  quantity: number
  price: number
}

interface Props {
  item: LineItem
  onUpdate: (id: string, field: 'quantity' | 'price', value: number) => void
  onRemove: (id: string) => void
  readonly?: boolean
  currencySymbol?: string
}

export function ItemLineEditor({ item, onUpdate, onRemove, readonly = false, currencySymbol = 'L' }: Props) {
  const subtotal = item.quantity * item.price

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        {item.sku && <Text style={styles.sku}>{item.sku}</Text>}
      </View>
      <View style={styles.controls}>
        {readonly ? (
          <Text style={styles.readonlyText}>{item.quantity} × {currencySymbol} {item.price.toFixed(2)}</Text>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cant.</Text>
              <TextInput
                style={styles.input}
                value={String(item.quantity)}
                onChangeText={v => onUpdate(item.id, 'quantity', Math.max(1, parseInt(v) || 0))}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Precio</Text>
              <TextInput
                style={styles.input}
                value={String(item.price)}
                onChangeText={v => onUpdate(item.id, 'price', parseFloat(v) || 0)}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
            </View>
          </>
        )}
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotal}>{currencySymbol} {subtotal.toFixed(2)}</Text>
          {!readonly && (
            <TouchableOpacity onPress={() => onRemove(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="delete-outline" size={18} color={tokens.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: tokens.spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
    gap: tokens.spacing.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.medium,
    color: tokens.colors.gray900,
  },
  sku: {
    fontSize: tokens.typography.size.xs,
    color: tokens.colors.gray400,
    marginTop: 2,
  },
  controls: {
    alignItems: 'flex-end',
    gap: 6,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputLabel: {
    fontSize: tokens.typography.size.xs,
    color: tokens.colors.gray400,
    width: 36,
    textAlign: 'right',
  },
  input: {
    width: 64,
    borderWidth: 1,
    borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: tokens.typography.size.sm,
    color: tokens.colors.gray900,
    textAlign: 'center',
    backgroundColor: tokens.colors.bgLight,
  },
  readonlyText: {
    fontSize: tokens.typography.size.sm,
    color: tokens.colors.gray600,
  },
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtotal: {
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.gray900,
  },
})
