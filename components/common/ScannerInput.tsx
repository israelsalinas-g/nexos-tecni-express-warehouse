import React, { useState } from 'react'
import { 
  View, TextInput, TouchableOpacity, StyleSheet, 
  Modal, Text, SafeAreaView 
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { BarcodeScanner } from './BarcodeScanner'

interface Props {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  label?: string
  error?: string
}

export const ScannerInput: React.FC<Props> = ({
  value,
  onChangeText,
  placeholder = 'Escanear o escribir SKU...',
  label,
  error,
}) => {
  const [isScannerVisible, setIsScannerVisible] = useState(false)

  const handleScanned = async (scannedValue: string) => {
    onChangeText(scannedValue)
    setIsScannerVisible(false)
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[styles.inputWrapper, !!error && styles.inputError]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.gray400}
          accessible
          accessibilityLabel={label || 'Entrada de código de barras'}
        />
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => setIsScannerVisible(true)}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Abrir escáner"
        >
          <MaterialCommunityIcons name="barcode-scan" size={24} color={tokens.colors.primary} />
        </TouchableOpacity>
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isScannerVisible}
        animationType="slide"
        onRequestClose={() => setIsScannerVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Escanear Código</Text>
            <TouchableOpacity 
              onPress={() => setIsScannerVisible(false)}
              style={styles.closeButton}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Cerrar escáner"
            >
              <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray800} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.scannerWrapper}>
            <BarcodeScanner onScanned={handleScanned} />
          </View>
          
          <View style={styles.modalFooter}>
            <Text style={styles.modalHint}>Centra el código en el recuadro para escanear</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: tokens.spacing[4] },
  label: { 
    fontSize: tokens.typography.size.sm, 
    color: tokens.colors.gray600, 
    fontWeight: tokens.typography.weight.semibold, 
    marginBottom: tokens.spacing[2] 
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.gray200,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    fontSize: tokens.typography.size.base,
    color: tokens.colors.gray900,
  },
  scanButton: {
    padding: tokens.spacing[3],
    backgroundColor: tokens.colors.gray100,
    borderLeftWidth: 1,
    borderLeftColor: tokens.colors.gray200,
  },
  inputError: { borderColor: tokens.colors.error },
  errorText: { color: tokens.colors.error, fontSize: tokens.typography.size.xs, marginTop: tokens.spacing[1] },
  
  modalContainer: { flex: 1, backgroundColor: '#000' },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.bgLight,
  },
  modalTitle: { fontSize: tokens.typography.size.lg, fontWeight: tokens.typography.weight.bold, color: tokens.colors.gray900 },
  closeButton: { padding: tokens.spacing[1] },
  scannerWrapper: { flex: 1 },
  modalFooter: { padding: tokens.spacing[5], alignItems: 'center', backgroundColor: '#000' },
  modalHint: { color: '#fff', fontSize: tokens.typography.size.sm, opacity: 0.8 },
})

