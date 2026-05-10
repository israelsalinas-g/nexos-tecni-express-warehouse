import { useState, useEffect, useCallback } from 'react'
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Modal, TextInput, Alert, SafeAreaView,
  Platform, KeyboardAvoidingView, Switch, ScrollView
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { ProfileService } from '@/services/profile.service'
import { Profile } from '@/types/database.types'
import { useRouter } from 'expo-router'

export default function CustomersScreen() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Profile | null>(null)
  
  // Form State
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    customer_type: 'public',
    type_verified: false,
    preferred_language: 'es'
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await ProfileService.getCustomers()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
      Alert.alert('Error', 'No se pudieron cargar los clientes.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const onRefresh = () => {
    setRefreshing(true)
    fetchCustomers()
  }

  const handleOpenModal = (customer?: Profile) => {
    if (customer) {
      setEditingCustomer(customer)
      setForm({
        full_name: customer.full_name,
        email: customer.email,
        phone: customer.phone || '',
        customer_type: customer.customer_type || 'public',
        type_verified: customer.type_verified || false,
        preferred_language: customer.preferred_language || 'es'
      })
    } else {
      setEditingCustomer(null)
      setForm({
        full_name: '',
        email: '',
        phone: '',
        customer_type: 'public',
        type_verified: false,
        preferred_language: 'es'
      })
    }
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio.')
      return
    }
    if (!form.email.trim()) {
      Alert.alert('Error', 'El correo es obligatorio.')
      return
    }

    try {
      setSubmitting(true)
      if (editingCustomer) {
        await ProfileService.update(editingCustomer.id, form)
      } else {
        await ProfileService.create(form)
      }
      setModalVisible(false)
      fetchCustomers()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar el cliente.')
    } finally {
      setSubmitting(false)
    }
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
        <Text style={styles.title}>Clientes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <MaterialCommunityIcons name="plus" size={24} color={tokens.colors.primary} />
        </TouchableOpacity>
      </View>


      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color={tokens.colors.gray200} />
            <Text style={styles.emptyText}>No hay clientes registrados.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.item}
            onPress={() => handleOpenModal(item)}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.full_name}</Text>
                {item.type_verified && (
                  <MaterialCommunityIcons name="check-decagram" size={16} color={tokens.colors.success} style={{ marginLeft: 4 }} />
                )}
              </View>
              <Text style={styles.email}>{item.email}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: item.customer_type === 'distributor' ? tokens.colors.primary + '15' : tokens.colors.gray100 }]}>
                  <Text style={[styles.badgeText, { color: item.customer_type === 'distributor' ? tokens.colors.primary : tokens.colors.gray600 }]}>
                    {item.customer_type.toUpperCase()}
                  </Text>
                </View>
                {item.phone && (
                  <View style={styles.contactInfo}>
                    <MaterialCommunityIcons name="phone" size={12} color={tokens.colors.gray400} />
                    <Text style={styles.contactText}>{item.phone}</Text>
                  </View>
                )}
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={tokens.colors.gray200} />

          </TouchableOpacity>
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
              <Text style={styles.modalTitle}>Gestionar Cliente</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray400} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre Completo</Text>
                  <TextInput
                    style={styles.input}
                    value={form.full_name}
                    onChangeText={(val) => setForm({...form, full_name: val})}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Correo Electrónico {!editingCustomer && '*'}</Text>
                  <TextInput
                    style={[styles.input, editingCustomer && { opacity: 0.6 }]}
                    value={form.email}
                    onChangeText={(val) => setForm({...form, email: val})}
                    editable={!editingCustomer}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>


                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Teléfono</Text>
                  <TextInput
                    style={styles.input}
                    value={form.phone}
                    onChangeText={(val) => setForm({...form, phone: val})}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tipo de Cliente</Text>
                  <View style={styles.typeSelector}>
                    {['public', 'distributor', 'wholesaler'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeOption,
                          form.customer_type === type && styles.typeOptionActive
                        ]}
                        onPress={() => setForm({...form, customer_type: type})}
                      >
                        <Text style={[
                          styles.typeOptionText,
                          form.customer_type === type && styles.typeOptionTextActive
                        ]}>
                          {type === 'public' ? 'Público' : type === 'distributor' ? 'Distribuidor' : 'Mayorista'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.switchRow}>
                  <View>
                    <Text style={styles.label}>Cliente Verificado</Text>
                    <Text style={styles.subLabel}>Habilita beneficios de su tipo</Text>
                  </View>
                  <Switch
                    value={form.type_verified}
                    onValueChange={(val) => setForm({...form, type_verified: val})}
                    trackColor={{ false: tokens.colors.gray200, true: tokens.colors.success + '80' }}
                    thumbColor={form.type_verified ? tokens.colors.success : tokens.colors.gray400}
                  />
                </View>

                <View style={styles.infoBox}>
                  <MaterialCommunityIcons name="information-outline" size={20} color={tokens.colors.primary} />
                  <Text style={styles.infoText}>
                    Los cambios realizados aquí se reflejarán inmediatamente en la cuenta web del cliente.
                  </Text>
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
                <Text style={styles.saveBtnText}>Guardar Cambios</Text>
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
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    ...tokens.shadow.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: tokens.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.gray900,
  },
  email: {
    fontSize: 13,
    color: tokens.colors.gray400,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  contactText: {
    fontSize: 11,
    color: tokens.colors.gray400,
    marginLeft: 4,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.gray600,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 12,
    color: tokens.colors.gray400,
  },
  input: {
    backgroundColor: tokens.colors.gray50,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
    color: tokens.colors.gray900,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.gray50,
    padding: 4,
    borderRadius: 12,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  typeOptionActive: {
    backgroundColor: '#fff',
    ...tokens.shadow.sm,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.gray400,
  },
  typeOptionTextActive: {
    color: tokens.colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.colors.gray50,
  },
  infoBox: {
    backgroundColor: tokens.colors.primary + '08',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 12,
    color: tokens.colors.primary,
    lineHeight: 18,
  },
  saveBtn: {
    backgroundColor: tokens.colors.primary,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
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
