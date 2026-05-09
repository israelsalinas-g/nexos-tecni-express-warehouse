import { useState, useEffect } from 'react'
import { 
  View, Text, StyleSheet, ScrollView, TextInput, 
  TouchableOpacity, ActivityIndicator, Alert, SafeAreaView,
  KeyboardAvoidingView, Platform, Image, Modal, FlatList
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { InventoryService } from '@/services/inventory.service'
import { ProductService } from '@/services/product.service'

interface SelectorItem {
  id: string
  name: string
}

export default function NewProductScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Data for selectors
  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalItems, setModalItems] = useState<SelectorItem[]>([])
  const [activeSelector, setActiveSelector] = useState<'brand' | 'category' | null>(null)

  // Form State
  const [form, setForm] = useState({
    name_es: '',
    sku: '',
    base_price: '',
    brand_id: '',
    category_id: '',
    initial_stock: '0',
    description_es: ''
  })

  useEffect(() => {
    loadSelectors()
  }, [])

  async function loadSelectors() {
    try {
      const [b, c] = await Promise.all([
        InventoryService.getBrands(),
        InventoryService.getCategories()
      ])
      setBrands(b)
      setCategories(c)
    } catch (error) {
      console.error('Error loading selectors:', error)
    }
  }

  const openSelector = (type: 'brand' | 'category') => {
    setActiveSelector(type)
    if (type === 'brand') {
      setModalTitle('Seleccionar Marca')
      setModalItems(brands.map(b => ({ id: b.id, name: b.name })))
    } else {
      setModalTitle('Seleccionar Categoría')
      setModalItems(categories.map(c => ({ id: c.id, name: c.name_es || c.name })))
    }
    setModalVisible(true)
  }

  const handleSelect = (item: SelectorItem) => {
    if (activeSelector === 'brand') {
      setForm({...form, brand_id: item.id})
    } else {
      setForm({...form, category_id: item.id})
    }
    setModalVisible(false)
  }

  const handleSave = async () => {
    if (!form.name_es || !form.sku || !form.base_price || !form.brand_id || !form.category_id) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios.')
      return
    }

    try {
      setLoading(true)
      
      const newProduct = await ProductService.create({
        name_es: form.name_es,
        sku: form.sku,
        base_price: parseFloat(form.base_price),
        brand_id: form.brand_id,
        category_id: form.category_id,
        description_es: form.description_es
      })

      Alert.alert('Éxito', 'Producto creado correctamente.', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear el producto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={tokens.colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.title}>Nuevo Producto</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Image Upload Placeholder */}
          <TouchableOpacity style={styles.imageUploadBox}>
            <View style={styles.imageIconCircle}>
              <MaterialCommunityIcons name="image-plus" size={32} color={tokens.colors.primary} />
            </View>
            <Text style={styles.uploadTitle}>Subir Imagen del Producto</Text>
            <Text style={styles.uploadSub}>Toca para seleccionar una imagen</Text>
            <View style={styles.uploadBtn}>
              <MaterialCommunityIcons name="upload" size={16} color="#fff" />
              <Text style={styles.uploadBtnText}>Elegir Archivo</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Producto</Text>
              <TextInput 
                style={styles.input}
                placeholder="Ej. Banda para Lavadora LG"
                value={form.name_es}
                onChangeText={(val) => setForm({...form, name_es: val})}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1.2, marginRight: 10 }]}>
                <Text style={styles.label}>Categoría</Text>
                <TouchableOpacity style={styles.select} onPress={() => openSelector('category')}>
                  <Text style={form.category_id ? styles.selectText : styles.placeholderText} numberOfLines={1}>
                    {categories.find(c => c.id === form.category_id)?.name_es || 'Seleccionar'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={tokens.colors.gray400} />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>SKU</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="SKU-001"
                  value={form.sku}
                  onChangeText={(val) => setForm({...form, sku: val})}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Marca</Text>
              <TouchableOpacity style={styles.select} onPress={() => openSelector('brand')}>
                <Text style={form.brand_id ? styles.selectText : styles.placeholderText}>
                  {brands.find(b => b.id === form.brand_id)?.name || 'Seleccionar Marca'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={tokens.colors.gray400} />
              </TouchableOpacity>
            </View>


            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cantidad Inicial</Text>
              <View style={styles.stockRow}>
                <TextInput 
                  style={[styles.input, { flex: 1, textAlign: 'center' }]}
                  keyboardType="number-pad"
                  value={form.initial_stock}
                  onChangeText={(val) => setForm({...form, initial_stock: val})}
                />
                <TouchableOpacity style={styles.stockActionBtn} onPress={() => {
                  const current = parseInt(form.initial_stock) || 0
                  setForm({...form, initial_stock: (current + 1).toString()})
                }}>
                  <Text style={styles.stockActionText}>Añadir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.stockActionBtn, { borderColor: tokens.colors.error }]} onPress={() => {
                  const current = parseInt(form.initial_stock) || 0
                  if (current > 0) setForm({...form, initial_stock: (current - 1).toString()})
                }}>
                  <Text style={[styles.stockActionText, { color: tokens.colors.error }]}>Quitar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Precio de Venta (L.)</Text>
              <TextInput 
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={form.base_price}
                onChangeText={(val) => setForm({...form, base_price: val})}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput 
                style={[styles.input, styles.textArea]}
                placeholder="Detalles adicionales..."
                multiline
                numberOfLines={4}
                value={form.description_es}
                onChangeText={(val) => setForm({...form, description_es: val})}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Producto</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Custom Dropdown Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modalTitle}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray400} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={modalItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.modalItem, 
                      (form.brand_id === item.id || form.category_id === item.id) && styles.modalItemActive
                    ]} 
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={[
                      styles.modalItemText,
                      (form.brand_id === item.id || form.category_id === item.id) && styles.modalItemTextActive
                    ]}>
                      {item.name}
                    </Text>
                    {(form.brand_id === item.id || form.category_id === item.id) && (
                      <MaterialCommunityIcons name="check" size={20} color={tokens.colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  backButton: {
    padding: 4,
    backgroundColor: tokens.colors.gray50,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.gray900,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  imageUploadBox: {
    backgroundColor: tokens.colors.gray50,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.gray100,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  imageIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...tokens.shadow.sm,
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.gray900,
    marginBottom: 4,
  },
  uploadSub: {
    fontSize: 13,
    color: tokens.colors.gray400,
    marginBottom: 20,
  },
  uploadBtn: {
    backgroundColor: tokens.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  form: {
    marginTop: 8,
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
  input: {
    backgroundColor: tokens.colors.gray50,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: tokens.colors.gray900,
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  select: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colors.gray50,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
    minHeight: 52,
  },
  selectText: {
    fontSize: 15,
    color: tokens.colors.gray900,
  },
  placeholderText: {
    fontSize: 15,
    color: tokens.colors.gray400,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockActionBtn: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: tokens.colors.primary,
  },
  stockActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.primary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.gray100,
  },
  saveButton: {
    backgroundColor: tokens.colors.primary,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    ...tokens.shadow.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    ...tokens.shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.gray900,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  modalItemActive: {
    backgroundColor: tokens.colors.primary + '05',
  },
  modalItemText: {
    fontSize: 16,
    color: tokens.colors.gray600,

  },
  modalItemTextActive: {
    color: tokens.colors.primary,
  },
})

