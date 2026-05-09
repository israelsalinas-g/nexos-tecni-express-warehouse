import React, { useState } from 'react'
import { 
  View, TextInput, TouchableOpacity, StyleSheet, 
  Modal, Text, SafeAreaView 
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
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
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => setIsScannerVisible(true)}
        >
          <MaterialCommunityIcons name="barcode-scan" size={24} color="#2563eb" />
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
            >
              <MaterialCommunityIcons name="close" size={24} color="#374151" />
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
  container: { marginBottom: 16 },
  label: { fontSize: 14, color: '#374151', fontWeight: '600', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  scanButton: {
    padding: 12,
    backgroundColor: '#eff6ff',
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  inputError: { borderColor: '#dc2626' },
  errorText: { color: '#dc2626', fontSize: 12, marginTop: 4 },
  
  modalContainer: { flex: 1, backgroundColor: '#000' },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeButton: { padding: 4 },
  scannerWrapper: { flex: 1 },
  modalFooter: { padding: 20, alignItems: 'center', backgroundColor: '#000' },
  modalHint: { color: '#fff', fontSize: 14, opacity: 0.8 },
})
