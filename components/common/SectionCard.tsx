import { ReactNode } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { tokens } from '@/theme/tokens'

interface RightAction {
  label: string
  onPress: () => void
  color?: string
}

interface Props {
  title?: string
  children: ReactNode
  rightAction?: RightAction
  style?: object
  noPadding?: boolean
}

export function SectionCard({ title, children, rightAction, style, noPadding }: Props) {
  return (
    <View style={[styles.card, style]}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {rightAction && (
            <TouchableOpacity onPress={rightAction.onPress}>
              <Text style={[styles.action, rightAction.color && { color: rightAction.color }]}>
                {rightAction.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={noPadding ? undefined : styles.body}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.lg,
    marginBottom: tokens.spacing.md,
    overflow: 'hidden',
    ...tokens.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  title: {
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
    color: tokens.colors.gray800,
  },
  action: {
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
    color: tokens.colors.primary,
  },
  body: {
    padding: tokens.spacing.md,
  },
})
