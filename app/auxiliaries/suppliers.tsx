import { useState, useEffect, useCallback } from 'react'
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Modal, TextInput, Alert, SafeAreaView,
  Platform, KeyboardAvoidingView, Switch, ScrollView
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { SupplierService } from '@/services/supplier.service'
import { Supplier } from '@/types/database.types'
import { useRouter } from 'expo-router'

export default function SuppliersScreen() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  
  // Form State
  const [form, setForm] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    country: 'HN',
    tax_id: '',
    payment_terms: '',
    notes: '',
    is_active: true
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await SupplierService.getAll()
      setSuppliers(data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      Alert.alert('Error', 'No se pudieron cargar los proveedores.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  const onRefresh = () => {
    setRefreshing(true)
    fetchSuppliers()
  }

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setForm({
        name: supplier.name,
        contact_name: supplier.contact_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        whatsapp: supplier.whatsapp || '',
        address: supplier.address || '',
        city: supplier.city || '',
        country: supplier.country || 'HN',
        tax_id: supplier.tax_id || '',
        payment_terms: supplier.payment_terms || '',
        notes: supplier.notes || '',
        is_active: supplier.is_active
      })
    } else {
      setEditingSupplier(null)
      setForm({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        whatsapp: '',
        address: '',
        city: '',
        country: 'HN',
        tax_id: '',
        payment_terms: '',
        notes: '',
        is_active: true
      })
    }
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'El nombre del proveedor es obligatorio.')
      return
    }

    try {
      setSubmitting(true)
      if (editingSupplier) {
        await SupplierService.update(editingSupplier.id, form)
      } else {
        await SupplierService.create(form)
      }
      setModalVisible(false)
      fetchSuppliers()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar el proveedor.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este proveedor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await SupplierService.delete(id)
              fetchSuppliers()
            } catch (error: any) {
              Alert.alert('Error', 'No se puede eliminar el proveedor porque tiene registros asociados.')
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
        <Text style={styles.title}>Proveedores</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <MaterialCommunityIcons name="plus" size={24} color={tokens.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={suppliers}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="truck-outline" size={48} color={tokens.colors.gray200} />
            <Text style={styles.emptyText}>No hay proveedores registrados.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={[styles.iconBox, !item.is_active && { opacity: 0.5 }]}>
              <MaterialCommunityIcons name="truck-delivery-outline" size={24} color={tokens.colors.primary} />
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, !item.is_active && styles.inactiveText]}>{item.name}</Text>
              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="account-outline" size={14} color={tokens.colors.gray400} />
                <Text style={styles.contactText}>{item.contact_name || 'Sin contacto'}</Text>
              </View>
              {(item.phone || item.whatsapp) && (
                <View style={styles.contactRow}>
                  <MaterialCommunityIcons name="phone-outline" size={14} color={tokens.colors.gray400} />
                  <Text style={styles.contactText}>{item.whatsapp || item.phone}</Text>
                </View>
              )}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionBtn}>
                <MaterialCommunityIcons name="pencil-outline" size={20} color={tokens.colors.info} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={tokens.colors.error} />
              </TouchableOpacity>
            </View>
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
              <Text style={styles.modalTitle}>
                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray400} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              <View style={styles.form}>
                <View style={styles.sectionTitleRow}>
                  <MaterialCommunityIcons name="office-building" size={18} color={tokens.colors.primary} />
                  <Text style={styles.sectionTitle}>Datos Generales</Text>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre Comercial *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Distribuidora Nexos"
                    value={form.name}
                    onChangeText={(val) => setForm({...form, name: val})}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>RTN / Tax ID</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0801..."
                      value={form.tax_id}
                      onChangeText={(val) => setForm({...form, tax_id: val})}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Términos Pago</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="30 días..."
                      value={form.payment_terms}
                      onChangeText={(val) => setForm({...form, payment_terms: val})}
                    />
                  </View>
                </View>

                <View style={styles.sectionTitleRow}>
                  <MaterialCommunityIcons name="account-box-outline" size={18} color={tokens.colors.primary} />
                  <Text style={styles.sectionTitle}>Contacto y Ubicación</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre de Contacto</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre completo"
                    value={form.contact_name}
                    onChangeText={(val) => setForm({...form, contact_name: val})}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="correo@ejemplo.com"
                    value={form.email}
                    onChangeText={(val) => setForm({...form, email: val})}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="+504..."
                      value={form.phone}
                      onChangeText={(val) => setForm({...form, phone: val})}
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>WhatsApp</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="+504..."
                      value={form.whatsapp}
                      onChangeText={(val) => setForm({...form, whatsapp: val})}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Dirección</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Calle, Ave, Edificio..."
                    value={form.address}
                    onChangeText={(val) => setForm({...form, address: val})}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Ciudad</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Tegucigalpa"
                      value={form.city}
                      onChangeText={(val) => setForm({...form, city: val})}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>País</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="HN"
                      value={form.country}
                      onChangeText={(val) => setForm({...form, country: val})}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Notas</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Observaciones adicionales..."
                    value={form.notes}
                    onChangeText={(val) => setForm({...form, notes: val})}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.label}>Proveedor Activo</Text>
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
                <Text style={styles.saveBtnText}>Guardar Proveedor</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.bgScreen,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.gray900,
  },
  addButton: {
    padding: 8,
    backgroundColor: tokens.colors.primary + '10',
    borderRadius: 12,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    ...tokens.shadow.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: tokens.colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.gray900,
  },
  inactiveText: {
    color: tokens.colors.gray400,
    textDecorationLine: 'line-through',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  contactText: {
    fontSize: 12,
    color: tokens.colors.gray400,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 8,
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 15,
    color: tokens.colors.gray400,
    marginTop: 16,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.gray900,
  },
  formScroll: {
    marginBottom: 20,
  },
  form: {
    paddingBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray50,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.primary,
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.gray600,
    marginBottom: 6,
  },
  input: {
    backgroundColor: tokens.colors.gray50,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
    color: tokens.colors.gray900,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingRight: 4,
  },
  saveBtn: {
    backgroundColor: tokens.colors.primary,
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    ...tokens.shadow.md,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  }
})
