import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'

interface Action {
  label: string
  onPress: () => void
}

interface Props {
  icon: string
  title: string
  subtitle?: string
  action?: Action
}

export function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon as any} size={48} color={tokens.colors.gray400} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action && (
        <TouchableOpacity style={styles.btn} onPress={action.onPress} activeOpacity={0.8}>
          <Text style={styles.btnText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.xl * 2,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
  },
  title: {
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.semibold,
    color: tokens.colors.gray800,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  subtitle: {
    fontSize: tokens.typography.size.base,
    color: tokens.colors.gray400,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: tokens.spacing.lg,
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm + 2,
    borderRadius: tokens.radius.lg,
  },
  btnText: {
    color: '#fff',
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
  },
})
