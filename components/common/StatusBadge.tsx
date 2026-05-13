import { View, Text, StyleSheet } from 'react-native'
import { tokens } from '@/theme/tokens'

export interface StatusConfig {
  label: string
  color: string
  bg: string
}

interface Props {
  status: string
  map: Record<string, StatusConfig>
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, map, size = 'md' }: Props) {
  const config = map[status] ?? { label: status, color: tokens.colors.gray600, bg: tokens.colors.gray100 }
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, size === 'sm' && styles.badgeSm]}>
      <Text style={[styles.label, { color: config.color }, size === 'sm' && styles.labelSm]}>
        {config.label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  label: {
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
  },
  labelSm: {
    fontSize: tokens.typography.size.xs,
  },
})
