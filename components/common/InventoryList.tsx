import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
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

export const InventoryList: React.FC<Props> = ({ 
  data, 
  onRefresh, 
  refreshing,
  onItemPress 
}) => {
  const renderItem = ({ item }: { item: InventoryRow }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.7}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Producto ${item.products?.name_es}, SKU ${item.products?.sku}, cantidad ${item.quantity}`}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.products?.name_es || 'Sin nombre'}
        </Text>
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
    alignItems: 'center',
    marginBottom: tokens.spacing[3],
  },
  productName: {
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.gray900,
    flex: 1,
    marginRight: tokens.spacing[2],
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
