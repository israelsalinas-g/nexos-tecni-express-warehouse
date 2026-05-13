import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image, Switch,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as ImagePicker from 'expo-image-picker'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ProductService } from '@/services/product.service'
import { InventoryService } from '@/services/inventory.service'
import { FormInput } from '@/components/common/FormInput'
import { SearchableSelector } from '@/components/common/SearchableSelector'
import { SectionCard } from '@/components/common/SectionCard'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { tokens } from '@/theme/tokens'
import { Product, ProductImage, Brand, Category } from '@/types/database.types'

const schema = z.object({
  name_es: z.string().min(2, 'Mínimo 2 caracteres'),
  name_en: z.string().optional(),
  description_es: z.string().optional(),
  price_public: z.string().min(1, 'Requerido'),
  price_tech: z.string().optional(),
  price_wholesale: z.string().optional(),
  is_active: z.boolean(),
  category_id: z.string().optional(),
  brand_id: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function EditProductScreen() {
  const { sku } = useLocalSearchParams<{ sku: string }>()
  const router = useRouter()

  const [product, setProduct] = useState<Product | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true },
  })

  const isActive = watch('is_active')

  const load = useCallback(async () => {
    try {
      const [prod, brandsData, catsData] = await Promise.all([
        ProductService.getBySku(sku),
        InventoryService.getBrands(),
        InventoryService.getCategories(),
      ])
      if (!prod) { Alert.alert('Error', 'Producto no encontrado'); router.back(); return }

      setProduct(prod)
      setBrands(brandsData)
      setCategories(catsData)

      const imgs = await ProductService.getImages(prod.id)
      setImages(imgs)

      reset({
        name_es: prod.name_es ?? '',
        name_en: prod.name_en ?? '',
        description_es: prod.description_es ?? '',
        price_public: String(prod.price_public ?? ''),
        price_tech: String((prod as any).price_tech ?? ''),
        price_wholesale: String((prod as any).price_wholesale ?? ''),
        is_active: prod.is_active ?? true,
        category_id: prod.category_id ?? undefined,
        brand_id: prod.brand_id ?? undefined,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [sku])

  useEffect(() => { load() }, [load])

  const onSubmit = async (data: FormData) => {
    if (!product) return
    setSaving(true)
    try {
      await ProductService.update(product.id, {
        name_es: data.name_es,
        name_en: data.name_en || undefined,
        description_es: data.description_es || undefined,
        price_public: parseFloat(data.price_public),
        is_active: data.is_active,
        category_id: data.category_id || undefined,
        brand_id: data.brand_id || undefined,
      })
      Alert.alert('Guardado', 'Producto actualizado correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch {
      Alert.alert('Error', 'No se pudo guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  const pickImage = async () => {
    if (!product) return
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permiso requerido', 'Se necesita acceso a la galería.'); return }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    })

    if (result.canceled || !result.assets?.[0]) return

    setUploadingImg(true)
    try {
      const newImg = await ProductService.uploadImage(product.id, result.assets[0].uri)
      setImages(prev => [...prev, newImg])
    } catch {
      Alert.alert('Error', 'No se pudo subir la imagen.')
    } finally {
      setUploadingImg(false)
    }
  }

  const deleteImage = async (imageId: string) => {
    try {
      await ProductService.deleteImage(imageId)
      setImages(prev => prev.filter(img => img.id !== imageId))
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la imagen.')
    } finally {
      setConfirmDelete(null)
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Custom header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Producto</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveBtnText}>Guardar</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* SKU badge */}
        <View style={styles.skuRow}>
          <View style={styles.skuBadge}>
            <Text style={styles.skuText}>{product?.sku}</Text>
          </View>
          <View style={[styles.activeBadge, { backgroundColor: isActive ? tokens.colors.success + '20' : tokens.colors.error + '20' }]}>
            <Text style={[styles.activeBadgeText, { color: isActive ? tokens.colors.success : tokens.colors.error }]}>
              {isActive ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>

        {/* Información básica */}
        <SectionCard title="Información Básica">
          <FormInput
            name="name_es"
            control={control}
            label="Nombre (ES) *"
            error={errors.name_es?.message}
          />
          <FormInput name="name_en" control={control} label="Nombre (EN)" error={errors.name_en?.message} />
          <FormInput
            name="description_es"
            control={control}
            label="Descripción"
            error={errors.description_es?.message}
          />

          {/* Estado activo */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Producto activo</Text>
            <Controller
              control={control}
              name="is_active"
              render={({ field: { value, onChange } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: tokens.colors.gray200, true: tokens.colors.primary + '80' }}
                  thumbColor={value ? tokens.colors.primary : tokens.colors.gray400}
                />
              )}
            />
          </View>
        </SectionCard>

        {/* Precios */}
        <SectionCard title="Precios (L.)">
          <FormInput name="price_public" control={control} label="Precio Público *" error={errors.price_public?.message} keyboardType="decimal-pad" />
          <FormInput name="price_tech" control={control} label="Precio Técnico" error={errors.price_tech?.message} keyboardType="decimal-pad" />
          <FormInput name="price_wholesale" control={control} label="Precio Mayoreo" error={errors.price_wholesale?.message} keyboardType="decimal-pad" />
        </SectionCard>

        {/* Clasificación */}
        <SectionCard title="Clasificación">
          <SearchableSelector
            label="Categoría"
            data={categories}
            value={categories.find(c => c.id === watch('category_id')) ?? null}
            onSelect={c => setValue('category_id', c.id)}
            searchKey="name_es"
            renderItem={c => <Text style={styles.optionText}>{c.name_es ?? c.name}</Text>}
            renderSelected={c => c.name_es ?? c.name ?? ''}
            placeholder="Seleccionar categoría"
          />
          <SearchableSelector
            label="Marca"
            data={brands}
            value={brands.find(b => b.id === watch('brand_id')) ?? null}
            onSelect={b => setValue('brand_id', b.id)}
            searchKey="name"
            renderItem={b => <Text style={styles.optionText}>{b.name}</Text>}
            renderSelected={b => b.name}
            placeholder="Seleccionar marca"
          />
        </SectionCard>

        {/* Imágenes */}
        <SectionCard title="Imágenes">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
            {images.map(img => (
              <View key={img.id} style={styles.imgWrap}>
                <Image source={{ uri: img.url }} style={styles.img} resizeMode="cover" />
                {img.is_primary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Principal</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.imgDeleteBtn} onPress={() => setConfirmDelete(img.id)}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={tokens.colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addImgBtn} onPress={pickImage} disabled={uploadingImg}>
              {uploadingImg
                ? <ActivityIndicator size="small" color={tokens.colors.primary} />
                : <>
                    <MaterialCommunityIcons name="camera-plus-outline" size={28} color={tokens.colors.primary} />
                    <Text style={styles.addImgText}>Agregar</Text>
                  </>
              }
            </TouchableOpacity>
          </ScrollView>
        </SectionCard>

        <View style={{ height: 32 }} />
      </ScrollView>

      <ConfirmSheet
        visible={confirmDelete !== null}
        title="Eliminar imagen"
        message="¿Seguro que quieres eliminar esta imagen? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => { if (confirmDelete) deleteImage(confirmDelete) }}
        onCancel={() => setConfirmDelete(null)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 12,
    backgroundColor: tokens.colors.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  headerBack: { padding: 4 },
  headerTitle: { fontSize: tokens.typography.size.lg, fontWeight: '700', color: tokens.colors.gray900 },
  saveBtn: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: tokens.radius.lg,
    minWidth: 80,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: tokens.typography.size.base },

  content: { padding: tokens.spacing.md },

  skuRow: { flexDirection: 'row', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md, alignItems: 'center' },
  skuBadge: { backgroundColor: tokens.colors.primary + '15', paddingHorizontal: 12, paddingVertical: 5, borderRadius: tokens.radius.full },
  skuText: { color: tokens.colors.primary, fontWeight: '700', fontSize: tokens.typography.size.sm },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: tokens.radius.full },
  activeBadgeText: { fontSize: tokens.typography.size.xs, fontWeight: '700' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  switchLabel: { fontSize: tokens.typography.size.base, color: tokens.colors.gray800, fontWeight: '500' },

  optionText: { fontSize: tokens.typography.size.base, color: tokens.colors.gray900 },

  imagesRow: { gap: tokens.spacing.sm, paddingVertical: 4 },
  imgWrap: { position: 'relative', width: 90, height: 90 },
  img: { width: 90, height: 90, borderRadius: tokens.radius.lg },
  primaryBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: tokens.colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  primaryBadgeText: { fontSize: 8, color: '#fff', fontWeight: '700' },
  imgDeleteBtn: { position: 'absolute', top: -6, right: -6 },
  addImgBtn: {
    width: 90, height: 90,
    borderRadius: tokens.radius.lg,
    borderWidth: 2, borderColor: tokens.colors.primary + '40',
    borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    gap: 4,
  },
  addImgText: { fontSize: tokens.typography.size.xs, color: tokens.colors.primary, fontWeight: '600' },
})
