import { useState, useEffect, useCallback } from 'react'
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Modal, TextInput, Alert,
  Platform, KeyboardAvoidingView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { BrandService } from '@/services/brand.service'
import { Brand } from '@/types/database.types'
import { useRouter } from 'expo-router'

export default function BrandsScreen() {
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [brandName, setBrandName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchBrands = useCallback(async () => {
    try {
      const data = await BrandService.getAll()
      setBrands(data)
    } catch (error) {
      console.error('Error fetching brands:', error)
      Alert.alert('Error', 'No se pudieron cargar las marcas.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  const onRefresh = () => {
    setRefreshing(true)
    fetchBrands()
  }

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand)
      setBrandName(brand.name)
    } else {
      setEditingBrand(null)
      setBrandName('')
    }
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!brandName.trim()) {
      Alert.alert('Error', 'El nombre de la marca es obligatorio.')
      return
    }

    try {
      setSubmitting(true)
      if (editingBrand) {
        await BrandService.update(editingBrand.id, brandName)
      } else {
        await BrandService.create(brandName)
      }
      setModalVisible(false)
      fetchBrands()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar la marca.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar esta marca?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await BrandService.delete(id)
              fetchBrands()
            } catch (error: any) {
              Alert.alert('Error', 'No se puede eliminar la marca porque tiene productos asociados.')
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
        <Text style={styles.title}>Marcas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <MaterialCommunityIcons name="plus" size={24} color={tokens.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={brands}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="tag-off-outline" size={48} color={tokens.colors.gray200} />
            <Text style={styles.emptyText}>No hay marcas registradas.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.brandItem}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandInitial}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.brandInfo}>
              <Text style={styles.brandName}>{item.name}</Text>
              <Text style={styles.brandSlug}>/{item.slug}</Text>
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
                {editingBrand ? 'Editar Marca' : 'Nueva Marca'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray400} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Nombre de la Marca</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Samsung, Whirlpool..."
                value={brandName}
                onChangeText={setBrandName}
                autoFocus
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, submitting && styles.btnDisabled]} 
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar</Text>
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
  brandItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    ...tokens.shadow.sm,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: tokens.colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  brandInfo: {
    flex: 1,
    marginLeft: 16,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.gray900,
  },
  brandSlug: {
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
  form: {
    marginBottom: 24,
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
