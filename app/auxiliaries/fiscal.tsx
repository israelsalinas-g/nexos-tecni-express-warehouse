import React, { useEffect, useState } from 'react'
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Alert, ActivityIndicator, Modal, TextInput, SafeAreaView,
  ScrollView, Dimensions
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { FiscalService } from '@/services/fiscal.service'
import { InvoiceAuthRange } from '@/types/database.types'
import { useRouter } from 'expo-router'

const { width } = Dimensions.get('window')

export default function FiscalScreen() {
  const router = useRouter()
  const [ranges, setRanges] = useState<InvoiceAuthRange[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState<Partial<InvoiceAuthRange>>({
    cai: '',
    prefix: '000-001-01',
    start_number: 1,
    end_number: 1000,
    current_number: 0,
    expiration_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    alert_threshold: 50
  })

  const fetchRanges = async () => {
    try {
      setLoading(true)
      const data = await FiscalService.getAllRanges()
      setRanges(data)
    } catch (error) {
      console.error(error)
      Alert.alert('Error', 'No se pudieron cargar los rangos fiscales')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRanges()
  }, [])

  const handleCreate = async () => {
    if (!form.cai || !form.prefix || !form.expiration_date) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios')
      return
    }

    try {
      setSaving(true)
      await FiscalService.createRange(form)
      Alert.alert('Éxito', 'Nuevo rango fiscal activado correctamente')
      setModalVisible(false)
      fetchRanges()
    } catch (error) {
      console.error(error)
      Alert.alert('Error', 'No se pudo crear el rango fiscal')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (item: InvoiceAuthRange) => {
    if (!item.is_active) return tokens.colors.gray400
    
    const remaining = item.end_number - item.current_number
    const expiration = new Date(item.expiration_date)
    const today = new Date()
    const diffDays = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 0 || remaining <= 0) return tokens.colors.error
    if (diffDays <= 30 || remaining <= item.alert_threshold) return tokens.colors.warning
    return tokens.colors.success
  }

  const renderItem = ({ item }: { item: InvoiceAuthRange }) => {
    const remaining = item.end_number - item.current_number
    const total = item.end_number - item.start_number + 1
    const progress = Math.min(1, Math.max(0, (item.current_number - item.start_number + 1) / total))
    const statusColor = getStatusColor(item)

    return (
      <View style={[styles.card, item.is_active && styles.activeCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerInfo}>
            <Text style={styles.caiLabel}>CAI</Text>
            <Text style={styles.caiValue} numberOfLines={1}>{item.cai}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {item.is_active ? 'ACTIVO' : 'INACTIVO'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Prefijo</Text>
              <Text style={styles.infoValue}>{item.prefix}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Vence el</Text>
              <Text style={styles.infoValue}>{item.expiration_date}</Text>
            </View>
          </View>

          <View style={styles.rangeRow}>
            <Text style={styles.rangeText}>
              Del {item.start_number.toString().padStart(8, '0')} al {item.end_number.toString().padStart(8, '0')}
            </Text>
          </View>

          {item.is_active && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Uso del Rango</Text>
                <Text style={styles.progressValue}>{Math.round(progress * 100)}% ({item.current_number} / {item.end_number})</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: statusColor }]} />
              </View>
              <Text style={[styles.remainingText, { color: statusColor }]}>
                {remaining} facturas restantes
              </Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Fiscal / CAI</Text>
          <Text style={styles.subtitle}>Gestión de rangos de facturación</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <MaterialCommunityIcons name="plus" size={24} color={tokens.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={tokens.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={ranges}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="file-document-outline" size={64} color={tokens.colors.gray100} />
              <Text style={styles.emptyText}>No hay rangos fiscales configurados</Text>
            </View>
          }
        />
      )}

      {/* Create Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Rango Fiscal</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray400} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContent}>
              <View style={styles.alertBox}>
                <MaterialCommunityIcons name="information" size={20} color={tokens.colors.primary} />
                <Text style={styles.alertText}>
                  Activar un nuevo rango desactivará automáticamente el rango actual.
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Número de CAI</Text>
                <TextInput 
                  style={styles.input}
                  value={form.cai}
                  onChangeText={(val) => setForm({...form, cai: val})}
                  placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XX"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Prefijo de Facturación</Text>
                <TextInput 
                  style={styles.input}
                  value={form.prefix}
                  onChangeText={(val) => setForm({...form, prefix: val})}
                  placeholder="000-001-01"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Inicio Rango</Text>
                  <TextInput 
                    style={styles.input}
                    value={form.start_number?.toString()}
                    onChangeText={(val) => setForm({...form, start_number: parseInt(val) || 0})}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Fin Rango</Text>
                  <TextInput 
                    style={styles.input}
                    value={form.end_number?.toString()}
                    onChangeText={(val) => setForm({...form, end_number: parseInt(val) || 0})}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Fecha de Vencimiento (YYYY-MM-DD)</Text>
                <TextInput 
                  style={styles.input}
                  value={form.expiration_date}
                  onChangeText={(val) => setForm({...form, expiration_date: val})}
                  placeholder="2025-12-31"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Alerta de Stock Bajo (Facturas)</Text>
                <TextInput 
                  style={styles.input}
                  value={form.alert_threshold?.toString()}
                  onChangeText={(val) => setForm({...form, alert_threshold: parseInt(val) || 0})}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                onPress={handleCreate}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Activar Rango</Text>}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100
  },
  backBtn: { marginRight: 16 },
  title: { fontSize: 22, fontWeight: '800', color: tokens.colors.gray900 },
  subtitle: { fontSize: 13, color: tokens.colors.gray400 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: tokens.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContent: { padding: 16 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
    ...tokens.shadow.sm
  },
  activeCard: {
    borderColor: tokens.colors.primary,
    borderWidth: 2,
    ...tokens.shadow.md
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  headerInfo: { flex: 1 },
  caiLabel: { fontSize: 10, fontWeight: '800', color: tokens.colors.gray400, textTransform: 'uppercase' },
  caiValue: { fontSize: 15, fontWeight: '700', color: tokens.colors.gray900, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  cardBody: { gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 11, color: tokens.colors.gray400, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: tokens.colors.gray800 },
  rangeRow: { 
    backgroundColor: tokens.colors.gray50, 
    padding: 10, 
    borderRadius: 12,
    alignItems: 'center'
  },
  rangeText: { fontSize: 13, fontWeight: '700', color: tokens.colors.gray600, letterSpacing: 1 },
  progressContainer: { marginTop: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: '600', color: tokens.colors.gray400 },
  progressValue: { fontSize: 12, fontWeight: '700', color: tokens.colors.gray900 },
  progressBarBg: { height: 8, backgroundColor: tokens.colors.gray100, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  remainingText: { fontSize: 12, fontWeight: '800', textAlign: 'right', marginTop: 8 },
  emptyState: { alignItems: 'center', marginTop: 80, opacity: 0.5 },
  emptyText: { marginTop: 12, fontSize: 14, color: tokens.colors.gray400, textAlign: 'center' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '90%' },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray50
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: tokens.colors.gray900 },
  formContent: { padding: 20 },
  alertBox: { 
    backgroundColor: tokens.colors.primary + '08', 
    padding: 16, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 24
  },
  alertText: { flex: 1, marginLeft: 12, fontSize: 12, color: tokens.colors.primary, fontWeight: '600' },
  field: { marginBottom: 20 },
  row: { flexDirection: 'row' },
  label: { fontSize: 13, fontWeight: '700', color: tokens.colors.gray600, marginBottom: 8 },
  input: {
    backgroundColor: tokens.colors.gray50,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: tokens.colors.gray100
  },
  saveBtn: {
    backgroundColor: tokens.colors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
})
