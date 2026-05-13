import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'

interface RightAction {
  icon?: string
  label?: string
  onPress: () => void
  color?: string
  disabled?: boolean
}

interface Props {
  title: string
  subtitle?: string
  onBack?: () => void
  rightAction?: RightAction
  transparent?: boolean
}

export function ScreenHeader({ title, subtitle, onBack, rightAction, transparent = false }: Props) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0) },
        transparent && styles.transparent,
      ]}
    >
      <View style={styles.inner}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>

        {rightAction ? (
          <TouchableOpacity
            style={styles.rightBtn}
            onPress={rightAction.onPress}
            disabled={rightAction.disabled}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {rightAction.icon ? (
              <MaterialCommunityIcons
                name={rightAction.icon as any}
                size={24}
                color={rightAction.disabled ? tokens.colors.gray400 : (rightAction.color ?? tokens.colors.primary)}
              />
            ) : (
              <Text style={[styles.rightLabel, rightAction.color ? { color: rightAction.color } : null]}>
                {rightAction.label}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.rightBtn} />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.sm,
    minHeight: 52,
  },
  backBtn: {
    width: 40,
    alignItems: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.gray900,
  },
  subtitle: {
    fontSize: tokens.typography.size.xs,
    color: tokens.colors.gray400,
    marginTop: 1,
  },
  rightBtn: {
    width: 40,
    alignItems: 'center',
  },
  rightLabel: {
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
    color: tokens.colors.primary,
  },
})
