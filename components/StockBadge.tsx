import { View, Text, StyleSheet } from 'react-native'

interface Props {
  quantity: number
  stockMin: number
}

export function StockBadge({ quantity, stockMin }: Props) {
  const level = quantity <= 0
    ? 'out'
    : quantity <= stockMin
    ? 'low'
    : 'ok'

  return (
    <View style={[styles.badge, styles[level]]}>
      <Text style={styles.text}>{quantity}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  out: { backgroundColor: '#dc2626' },
  low: { backgroundColor: '#d97706' },
  ok:  { backgroundColor: '#16a34a' },
})
