import { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera'

interface Props {
  onScanned: (sku: string) => Promise<void>
}

export function BarcodeScanner({ onScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanning, setScanning] = useState(false)

  const handleBarcode = useCallback(async (result: BarcodeScanningResult) => {
    if (scanning) return
    setScanning(true)
    try {
      await onScanned(result.data)
    } finally {
      // Brief cooldown to prevent repeated scans
      setTimeout(() => setScanning(false), 2000)
    }
  }, [scanning, onScanned])

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>
          Se requiere acceso a la cámara para escanear códigos de barras.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'qr', 'code39'] }}
        onBarcodeScanned={handleBarcode}
      />

      {/* Scanning frame overlay */}
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.hint}>
          {scanning ? 'Procesando...' : 'Centra el código en el recuadro'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 260,
    height: 160,
    borderWidth: 3,
    borderColor: '#2563eb',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  hint: {
    marginTop: 20,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  permissionText: { fontSize: 15, color: '#374151', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  button: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
