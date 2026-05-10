import { useState, useEffect, useCallback } from 'react'
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Modal, TextInput, Alert, SafeAreaView,
  Platform, KeyboardAvoidingView, Switch, ScrollView
} from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { WarehouseService } from '@/services/warehouse.service'
import { Warehouse } from '@/types/database.types'
import { useRouter } from 'expo-router'

export default function WarehousesScreen() {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [location, setLocation] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchWarehouses = useCallback(async () => {
    try {
      const data = await WarehouseService.getAll()
      setWarehouses(data)
    } catch (error) {
      console.error('Error fetching warehouses:', error)
      Alert.alert('Error', 'No se pudieron cargar las bodegas.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchWarehouses()
  }, [fetchWarehouses])

  const onRefresh = () => {
    setRefreshing(true)
    fetchWarehouses()
  }

  const handleOpenModal = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse)
      setName(warehouse.name)
      setCode(warehouse.code || '')
      setLocation(warehouse.location || '')
      setIsActive(warehouse.is_active)
    } else {
      setEditingWarehouse(null)
      setName('')
      setCode('')
      setLocation('')
      setIsActive(true)
    }
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la bodega es obligatorio.')
      return
    }

    try {
      setSubmitting(true)
      if (editingWarehouse) {
        await WarehouseService.update(editingWarehouse.id, {
          name,
          code,
          location,
          is_active: isActive
        })
      } else {
        await WarehouseService.create(name, code, location)
      }
      setModalVisible(false)
      fetchWarehouses()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar la bodega.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar esta bodega?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await WarehouseService.delete(id)
              fetchWarehouses()
            } catch (error: any) {
              Alert.alert('Error', 'No se puede eliminar la bodega porque tiene inventario asociado.')
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
        <Text style={styles.title}>Bodegas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <MaterialCommunityIcons name="plus" size={24} color={tokens.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={warehouses}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="warehouse" size={48} color={tokens.colors.gray200} />
            <Text style={styles.emptyText}>No hay bodegas registradas.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={[styles.iconBox, !item.is_active && { opacity: 0.5 }]}>
              <MaterialCommunityIcons name="warehouse" size={24} color={tokens.colors.primary} />
            </View>
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, !item.is_active && styles.inactiveText]}>{item.name}</Text>
                {item.code && <View style={styles.codeBadge}><Text style={styles.codeText}>{item.code}</Text></View>}
              </View>
              <Text style={styles.location} numberOfLines={1}>
                {item.location || 'Sin ubicación física'}
              </Text>
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
                {editingWarehouse ? 'Editar Bodega' : 'Nueva Bodega'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray400} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre de la Bodega</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Bodega Principal"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Código (Opcional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. B-001"
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ubicación / Dirección</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Dirección física..."
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.label}>Bodega Activa</Text>
                  <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: tokens.colors.gray200, true: tokens.colors.primary + '80' }}
                    thumbColor={isActive ? tokens.colors.primary : tokens.colors.gray400}
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
                <Text style={styles.saveBtnText}>Guardar Bodega</Text>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  codeBadge: {
    backgroundColor: tokens.colors.gray100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  codeText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.gray600,
  },
  location: {
    fontSize: 12,
    color: tokens.colors.gray400,
    marginTop: 2,
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
    maxHeight: '80%',
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.gray600,
    marginBottom: 8,
  },
  input: {
    backgroundColor: tokens.colors.gray50,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
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
