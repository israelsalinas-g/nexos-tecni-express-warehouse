import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { InventoryRow } from '@/types/database.types'
import { tokens } from '@/theme/tokens'

interface Props {
  data: InventoryRow[]
  onRefresh?: () => void
  refreshing?: boolean
  onItemPress?: (item: InventoryRow) => void
}

const BRAND_LOGOS: Record<string, any> = {
  'Frigidaire': require('@/assets/brands/frigidaire.png'),
  'Mabe': require('@/assets/brands/mabe.jpg'),
  'Whirlpool': require('@/assets/brands/whirlpool.png'),
}

export const InventoryList: React.FC<Props> = ({ 
  data, 
  onRefresh, 
  refreshing,
  onItemPress 
}) => {
  const renderItem = ({ item }: { item: InventoryRow }) => {
    const brandName = item.products?.brands?.name || ''
    const brandLogo = BRAND_LOGOS[brandName]

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => onItemPress?.(item)}
        activeOpacity={0.7}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Producto ${item.products?.name_es}, Marca ${brandName}, SKU ${item.products?.sku}, cantidad ${item.quantity}`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleWrapper}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.products?.name_es || 'Sin nombre'}
            </Text>
            {brandName ? (
              <View style={styles.brandBadge}>
                {brandLogo ? (
                  <Image source={brandLogo} style={styles.brandIcon} resizeMode="contain" />
                ) : (
                  <Text style={styles.brandText}>{brandName}</Text>
                )}
              </View>
            ) : null}
          </View>
          <View style={styles.qtyBadge}>
            <Text style={styles.qtyText}>{item.quantity}</Text>
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <View style={styles.skuWrapper}>
            <MaterialCommunityIcons name="barcode" size={14} color={tokens.colors.gray400} />
            <Text style={styles.skuText}>{item.products?.sku || 'S/SKU'}</Text>
          </View>
          <View style={styles.warehouseWrapper}>
            <MaterialCommunityIcons name="store" size={14} color={tokens.colors.gray400} />
            <Text style={styles.warehouseText}>{item.warehouses?.name || 'S/B'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <FlashList<InventoryRow>
      data={data}
      renderItem={renderItem}
      onRefresh={onRefresh}
      refreshing={refreshing}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="package-variant" size={48} color={tokens.colors.gray200} />
          <Text style={styles.emptyText}>No hay productos en el inventario.</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  list: { padding: tokens.spacing[4] },
  card: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing[4],
    marginBottom: tokens.spacing[3],
    ...tokens.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing[3],
  },
  titleWrapper: { flex: 1, marginRight: tokens.spacing[2] },
  productName: {
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.gray900,
    marginBottom: 2,
  },
  brandBadge: {
    alignSelf: 'flex-start',
  },
  brandIcon: {
    width: 60,
    height: 18,
  },
  brandText: {
    fontSize: tokens.typography.size.xs,
    color: tokens.colors.gray400,
    textTransform: 'uppercase',
    fontWeight: tokens.typography.weight.semibold,
  },
  qtyBadge: {
    backgroundColor: tokens.colors.gray100,
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.md,
  },
  qtyText: {
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skuWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skuText: {
    fontSize: tokens.typography.size.xs,
    color: tokens.colors.gray600,
    marginLeft: tokens.spacing[1],
  },
  warehouseWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warehouseText: {
    fontSize: tokens.typography.size.xs,
    color: tokens.colors.gray400,
    marginLeft: tokens.spacing[1],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.spacing[10],
  },
  emptyText: {
    marginTop: tokens.spacing[4],
    color: tokens.colors.gray400,
    fontSize: tokens.typography.size.base,
  },
})

