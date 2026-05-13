import { useState, useEffect, useCallback } from 'react'
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Modal, TextInput, Alert,
  Platform, KeyboardAvoidingView, Switch, ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { CarrierService, CarrierFormData } from '@/services/carrier.service'
import { Carrier } from '@/types/database.types'
import { useRouter } from 'expo-router'

export default function CarriersScreen() {
  const router = useRouter()
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null)
  
  // Form State
  const [form, setForm] = useState<CarrierFormData>({
    name: '',
    phone: '',
    email: '',
    tracking_url_template: '',
    is_active: true
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchCarriers = useCallback(async () => {
    try {
      const data = await CarrierService.getAll()
      setCarriers(data)
    } catch (error) {
      console.error('Error fetching carriers:', error)
      Alert.alert('Error', 'No se pudieron cargar los transportistas.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchCarriers()
  }, [fetchCarriers])

  const onRefresh = () => {
    setRefreshing(true)
    fetchCarriers()
  }

  const handleOpenModal = (carrier?: Carrier) => {
    if (carrier) {
      setEditingCarrier(carrier)
      setForm({
        name: carrier.name,
        phone: carrier.phone || '',
        email: carrier.email || '',
        tracking_url_template: carrier.tracking_url_template || '',
        is_active: carrier.is_active
      })
    } else {
      setEditingCarrier(null)
      setForm({
        name: '',
        phone: '',
        email: '',
        tracking_url_template: '',
        is_active: true
      })
    }
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio.')
      return
    }

    try {
      setSubmitting(true)
      const data: CarrierFormData = {
        name: form.name.trim(),
        phone: form.phone?.trim() || null,
        email: form.email?.trim() || null,
        tracking_url_template: form.tracking_url_template?.trim() || null,
        is_active: form.is_active
      }

      if (editingCarrier) {
        await CarrierService.update(editingCarrier.id, data)
      } else {
        await CarrierService.create(data)
      }
      setModalVisible(false)
      fetchCarriers()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar el transportista.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (carrier: Carrier) => {
    Alert.alert(
      'Eliminar Transportista',
      `¿Estás seguro de que deseas eliminar a ${carrier.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await CarrierService.delete(carrier.id)
              fetchCarriers()
            } catch (error: any) {
              Alert.alert('Error', 'No se pudo eliminar el transportista. Asegúrate de que no tenga envíos asociados.')
            }
          }
        }
      ]
    )
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.title}>Transportistas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <MaterialCommunityIcons name="plus" size={24} color={tokens.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={carriers}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="truck-delivery-outline" size={48} color={tokens.colors.gray200} />
            <Text style={styles.emptyText}>No hay transportistas registrados.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <TouchableOpacity 
              style={styles.item}
              onPress={() => handleOpenModal(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: item.is_active ? tokens.colors.primary + '10' : tokens.colors.gray100 }]}>
                <MaterialCommunityIcons 
                  name="truck-delivery" 
                  size={24} 
                  color={item.is_active ? tokens.colors.primary : tokens.colors.gray400} 
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.contactRow}>
                  {item.phone ? (
                    <Text style={styles.contactText}>{item.phone}</Text>
                  ) : null}
                  {item.phone && item.email ? <Text style={styles.dot}> • </Text> : null}
                  {item.email ? (
                    <Text style={styles.contactText} numberOfLines={1}>{item.email}</Text>
                  ) : null}
                </View>
                {!item.phone && !item.email && (
                  <Text style={styles.noContact}>Sin datos de contacto</Text>
                )}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={tokens.colors.error} />
                </TouchableOpacity>
                <MaterialCommunityIcons name="chevron-right" size={20} color={tokens.colors.gray200} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCarrier ? 'Editar Transportista' : 'Nuevo Transportista'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray400} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre del Transportista *</Text>
                  <TextInput
                    style={styles.input}
                    value={form.name}
                    onChangeText={(val) => setForm({...form, name: val})}
                    placeholder="Ej. DHL, Urbano Express"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Teléfono de Contacto</Text>
                  <TextInput
                    style={styles.input}
                    value={form.phone || ''}
                    onChangeText={(val) => setForm({...form, phone: val})}
                    keyboardType="phone-pad"
                    placeholder="+504 XXXX-XXXX"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Correo Electrónico</Text>
                  <TextInput
                    style={styles.input}
                    value={form.email || ''}
                    onChangeText={(val) => setForm({...form, email: val})}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="contacto@empresa.com"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Template URL de Tracking</Text>
                  <TextInput
                    style={styles.input}
                    value={form.tracking_url_template || ''}
                    onChangeText={(val) => setForm({...form, tracking_url_template: val})}
                    placeholder="https://carrier.com/track?n={tracking_number}"
                  />
                  <Text style={styles.hint}>Usa {'{tracking_number}'} como marcador</Text>
                </View>

                <View style={styles.switchRow}>
                  <View>
                    <Text style={styles.label}>Transportista Activo</Text>
                    <Text style={styles.subLabel}>Permitir asignar nuevos envíos</Text>
                  </View>
                  <Switch
                    value={form.is_active}
                    onValueChange={(val) => setForm({...form, is_active: val})}
                    trackColor={{ false: tokens.colors.gray200, true: tokens.colors.primary + '80' }}
                    thumbColor={form.is_active ? tokens.colors.primary : tokens.colors.gray400}
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.saveBtn, submitting && styles.btnDisabled]} 
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar Transportista</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: tokens.colors.gray100,
  },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: tokens.colors.gray900 },
  addButton: { padding: 8, backgroundColor: tokens.colors.primary + '10', borderRadius: 12 },
  list: { padding: 16, paddingBottom: 40 },
  itemContainer: { marginBottom: 12 },
  item: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', ...tokens.shadow.sm,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  info: { flex: 1, marginLeft: 16 },
  name: { fontSize: 16, fontWeight: '700', color: tokens.colors.gray900 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  contactText: { fontSize: 12, color: tokens.colors.gray400 },
  dot: { fontSize: 12, color: tokens.colors.gray200 },
  noContact: { fontSize: 12, color: tokens.colors.gray400, fontStyle: 'italic', marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteBtn: { padding: 8 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 15, color: tokens.colors.gray400, marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: tokens.colors.gray900 },
  formScroll: { marginBottom: 20 },
  form: { paddingBottom: 10 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: tokens.colors.gray600, marginBottom: 8 },
  subLabel: { fontSize: 12, color: tokens.colors.gray400 },
  input: {
    backgroundColor: tokens.colors.gray50, borderRadius: 14, padding: 14,
    fontSize: 15, borderWidth: 1, borderColor: tokens.colors.gray100, color: tokens.colors.gray900,
  },
  hint: { fontSize: 10, color: tokens.colors.gray400, marginTop: 4, marginLeft: 4 },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: tokens.colors.gray50,
  },
  saveBtn: {
    backgroundColor: tokens.colors.primary, borderRadius: 16, height: 56,
    justifyContent: 'center', alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
})
