import { useEffect, useState, useCallback } from 'react'
import { 
  View, ActivityIndicator, Text, StyleSheet, 
  ScrollView, Image, TouchableOpacity, SafeAreaView,
  StatusBar,
  Platform
} from 'react-native'
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { tokens } from '@/theme/tokens'
import { InventoryService } from '@/services/inventory.service'
import { ProductService } from '@/services/product.service'

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop'

export default function ProductDetailScreen() {
  const { sku } = useLocalSearchParams<{ sku: string }>()
  const router = useRouter()
  const navigation = useNavigation()
  
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      // 1. Get Product Details
      const prod = await ProductService.getBySku(sku)
      if (!prod) {
        setNotFound(true)
        return
      }
      setProduct(prod)
      navigation.setOptions({ title: prod.sku })

      // 2. Get Inventory Details
      const inv = await InventoryService.getStockByProduct(prod.id)
      setInventory(inv)
    } catch (error) {
      console.error('Error loading product details:', error)
    } finally {
      setLoading(false)
    }
  }, [sku])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    )
  }

  if (notFound) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="package-variant-remove" size={64} color={tokens.colors.gray400} />
        <Text style={styles.notFoundText}>Producto no encontrado</Text>
        <Text style={styles.notFoundSub}>El SKU {sku} no existe en la base de datos.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Regresar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const totalStock = inventory.reduce((acc, curr) => acc + curr.quantity, 0)
  const isOutOfStock = totalStock === 0

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image Section */}
        <View style={styles.imageContainer}>
          {product.main_image_url ? (
            <Image 
              source={{ uri: product.main_image_url }} 
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <MaterialCommunityIcons name="image-off-outline" size={64} color={tokens.colors.gray400} />

              <Text style={styles.noImageText}>Sin imagen disponible</Text>
            </View>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={tokens.colors.gray900} />
          </TouchableOpacity>
        </View>


        <View style={styles.content}>
          {/* Title & Price Row */}
          <View style={styles.headerInfo}>
            <View style={styles.titleWrapper}>
              <Text style={styles.skuBadge}>{product.sku}</Text>
              <Text style={styles.productName}>{product.name_es}</Text>
              {product.name_en && (
                <Text style={styles.productNameEn}>{product.name_en}</Text>
              )}
            </View>
            <View style={styles.priceTag}>
              <Text style={styles.priceLabel}>Precio Sugerido</Text>
              <Text style={styles.priceValue}>${product.base_price?.toFixed(2)}</Text>
            </View>
          </View>

          {/* Badges Section */}
          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="tag-outline" size={16} color={tokens.colors.gray600} />
              <Text style={styles.badgeText}>Repuestos</Text>
            </View>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="factory" size={16} color={tokens.colors.gray600} />
              <Text style={styles.badgeText}>Tecni-Express</Text>
            </View>
          </View>

          {/* Stock Overview Card */}
          <View style={[styles.stockCard, isOutOfStock && styles.stockCardEmpty]}>
            <View style={styles.stockCardHeader}>
              <MaterialCommunityIcons 
                name={isOutOfStock ? "alert-circle" : "check-circle"} 
                size={24} 
                color={isOutOfStock ? tokens.colors.error : tokens.colors.success} 
              />
              <Text style={[styles.stockCardTitle, { color: isOutOfStock ? tokens.colors.error : tokens.colors.success }]}>
                {isOutOfStock ? 'Agotado' : 'Disponible'}
              </Text>
              <Text style={styles.stockCardTotal}>{totalStock} unidades en total</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.warehouseList}>
              <Text style={styles.sectionTitle}>Ubicación por Bodega</Text>
              {inventory.map((item, idx) => (
                <View key={idx} style={styles.warehouseRow}>
                  <View style={styles.warehouseInfo}>
                    <Text style={styles.warehouseName}>{item.warehouses?.name || 'Bodega'}</Text>
                    <Text style={styles.warehouseCode}>{item.location_code || 'Pasillo A-1'}</Text>
                  </View>
                  <View style={styles.warehouseStock}>
                    <Text style={[styles.stockValue, item.quantity < item.stock_min && { color: tokens.colors.warning }]}>
                      {item.quantity}
                    </Text>
                    <Text style={styles.stockUnit}>unds</Text>
                  </View>
                </View>
              ))}
              {inventory.length === 0 && (
                <Text style={styles.emptyInventory}>No hay registros de inventario para este producto.</Text>
              )}
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>
              {product.description_es || 'No hay descripción disponible para este producto en este momento.'}
            </Text>
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => {}}>
          <MaterialCommunityIcons name="swap-horizontal" size={24} color={tokens.colors.primary} />
          <Text style={styles.secondaryActionText}>Traslado</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryAction} onPress={() => {}}>
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
          <Text style={styles.primaryActionText}>Añadir a Orden</Text>
        </TouchableOpacity>
      </View>
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
    padding: tokens.spacing[8],
    backgroundColor: tokens.colors.bgScreen,
  },
  imageContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: tokens.colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 10,
    color: tokens.colors.gray400,
    fontSize: tokens.typography.size.sm,
    fontWeight: '500',
  },
  image: {

    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 20,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...tokens.shadow.md,
  },
  content: {
    marginTop: -30,
    backgroundColor: tokens.colors.bgScreen,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: tokens.spacing[6],
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing[4],
  },
  titleWrapper: {
    flex: 1,
    marginRight: tokens.spacing[4],
  },
  skuBadge: {
    backgroundColor: tokens.colors.primary + '15',
    color: tokens.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: tokens.colors.gray900,
    lineHeight: 28,
  },
  productNameEn: {
    fontSize: 14,
    color: tokens.colors.gray400,
    marginTop: 2,
    fontStyle: 'italic',
  },
  priceTag: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 10,
    color: tokens.colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: tokens.colors.primary,
  },
  badgesRow: {
    flexDirection: 'row',
    marginBottom: tokens.spacing[6],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  badgeText: {
    fontSize: 12,
    color: tokens.colors.gray600,
    marginLeft: 4,
    fontWeight: '500',
  },
  stockCard: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: 20,
    padding: tokens.spacing[5],
    ...tokens.shadow.md,
    marginBottom: tokens.spacing[6],
  },
  stockCardEmpty: {
    borderWidth: 1,
    borderColor: tokens.colors.error + '30',
  },
  stockCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing[4],
  },
  stockCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  stockCardTotal: {
    fontSize: 14,
    color: tokens.colors.gray400,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.gray100,
    marginBottom: tokens.spacing[4],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.gray800,
    marginBottom: tokens.spacing[3],
  },
  warehouseList: {
    marginTop: 4,
  },
  warehouseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  warehouseName: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.gray800,
  },
  warehouseCode: {
    fontSize: 12,
    color: tokens.colors.gray400,
    marginTop: 2,
  },
  warehouseInfo: {
    flex: 1,
  },
  warehouseStock: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  stockValue: {
    fontSize: 18,
    fontWeight: '800',
    color: tokens.colors.gray900,
  },
  stockUnit: {
    fontSize: 12,
    color: tokens.colors.gray400,
    marginLeft: 4,
  },
  emptyInventory: {
    color: tokens.colors.gray400,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  descriptionSection: {
    paddingHorizontal: tokens.spacing[2],
  },
  descriptionText: {
    fontSize: 14,
    color: tokens.colors.gray600,
    lineHeight: 22,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.colors.bgLight,
    padding: tokens.spacing[4],
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: tokens.colors.gray100,
    ...tokens.shadow.lg,
  },
  primaryAction: {
    flex: 1.5,
    backgroundColor: tokens.colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 54,
    marginLeft: tokens.spacing[3],
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: tokens.colors.bgLight,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: tokens.colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 54,
  },
  secondaryActionText: {
    color: tokens.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  notFoundText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: tokens.colors.gray800,
    marginTop: 16,
  },
  notFoundSub: {
    fontSize: 14,
    color: tokens.colors.gray400,
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
})
