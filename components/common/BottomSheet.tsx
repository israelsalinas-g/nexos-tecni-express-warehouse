import { ReactNode } from 'react'
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { tokens } from '@/theme/tokens'

interface Props {
  visible: boolean
  onClose: () => void
  title?: string
  height?: '40%' | '50%' | '70%' | '85%' | 'auto'
  children: ReactNode
  showHandle?: boolean
}

export function BottomSheet({ visible, onClose, title, height = 'auto', children, showHandle = true }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, height !== 'auto' && { height }]}>
          {showHandle && <View style={styles.handle} />}
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: tokens.colors.bgLight,
    borderTopLeftRadius: tokens.radius['2xl'],
    borderTopRightRadius: tokens.radius['2xl'],
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    ...tokens.shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.colors.gray200,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  title: {
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.gray900,
  },
  closeBtn: {
    fontSize: 16,
    color: tokens.colors.gray400,
    fontWeight: tokens.typography.weight.bold,
  },
})
