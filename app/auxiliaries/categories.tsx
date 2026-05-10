import { useState, useEffect, useCallback } from 'react'
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Modal, TextInput, Alert, Platform, KeyboardAvoidingView 
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { CategoryService } from '@/services/category.service'
import { Category } from '@/types/database.types'
import { useRouter } from 'expo-router'

export default function CategoriesScreen() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [nameEs, setNameEs] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      const data = await CategoryService.getAll()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      Alert.alert('Error', 'No se pudieron cargar las categorías.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const onRefresh = () => {
    setRefreshing(true)
    fetchCategories()
  }

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setNameEs(category.name_es || '')
    } else {
      setEditingCategory(null)
      setNameEs('')
    }
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!nameEs.trim()) {
      Alert.alert('Error', 'El nombre de la categoría es obligatorio.')
      return
    }

    try {
      setSubmitting(true)
      if (editingCategory) {
        await CategoryService.update(editingCategory.id, nameEs)
      } else {
        await CategoryService.create(nameEs)
      }
      setModalVisible(false)
      fetchCategories()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar la categoría.')
    } finally {
      setSubmitting(false)
    }
  }


  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar esta categoría?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await CategoryService.delete(id)
              fetchCategories()
            } catch (error: any) {
              Alert.alert('Error', 'No se puede eliminar la categoría porque tiene productos asociados.')
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
        <Text style={styles.title}>Categorías</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <MaterialCommunityIcons name="plus" size={24} color={tokens.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="shape-outline" size={48} color={tokens.colors.gray200} />
            <Text style={styles.emptyText}>No hay categorías registradas.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="folder-outline" size={24} color={tokens.colors.primary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name_es}</Text>
              <Text style={styles.slug}>/{item.slug}</Text>
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
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray400} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre de la Categoría</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Tarjetas Electrónicas"
                  value={nameEs}
                  onChangeText={setNameEs}
                  autoFocus
                />
              </View>
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
  slug: {
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
