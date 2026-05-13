import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { BottomSheet } from './BottomSheet'
import { tokens } from '@/theme/tokens'

interface Props {
  visible: boolean
  title: string
  message: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
}

export function ConfirmSheet({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
}: Props) {
  return (
    <BottomSheet visible={visible} onClose={onCancel} height="auto">
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, destructive && styles.destructiveBtn]}
            onPress={onConfirm}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  body: {
    padding: tokens.spacing.lg,
  },
  title: {
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.gray900,
    marginBottom: tokens.spacing.sm,
  },
  message: {
    fontSize: tokens.typography.size.base,
    color: tokens.colors.gray600,
    lineHeight: 22,
    marginBottom: tokens.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: tokens.radius.lg,
    borderWidth: 1.5,
    borderColor: tokens.colors.gray200,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
    color: tokens.colors.gray600,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
  },
  destructiveBtn: {
    backgroundColor: tokens.colors.error,
  },
  confirmText: {
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
    color: '#fff',
  },
})
