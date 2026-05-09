import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { InventoryRow } from '@/types/database.types'
import { tokens } from '@/theme/tokens'

interface GroupedProduct {
  productId: string
  name: string
  sku: string
  brandName: string
  categoryName: string
  totalStock: number
  warehouses: {
    name: string
    code: string
    quantity: number
  }[]
  price?: number
}

interface Props {
  data: GroupedProduct[]
  onRefresh?: () => void
  refreshing?: boolean
  onItemPress?: (item: GroupedProduct) => void
}

const BRAND_LOGOS: Record<string, any> = {
  'Frigidare': require('@/assets/brands/frigidaire.png'),
  'Mabe': require('@/assets/brands/mabe.jpg'),
  'Whirlpool': require('@/assets/brands/whirlpool.png'),
}

export const ProductList: React.FC<Props> = ({ 
  data, 
  onRefresh, 
  refreshing,
  onItemPress 
}) => {
  const renderItem = ({ item }: { item: GroupedProduct }) => {
    const brandLogo = BRAND_LOGOS[item.brandName]
    
    // Status Logic
    let statusColor: string = tokens.colors.success

    let statusIcon: any = 'check-circle'
    if (item.totalStock === 0) {
      statusColor = tokens.colors.secondary
      statusIcon = 'cancel'
    } else if (item.totalStock < 5) {
      statusColor = tokens.colors.warning
      statusIcon = 'alert-circle'
    }

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => onItemPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleWrapper}>
            <Text style={styles.skuText}>SKU: {item.sku}</Text>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
          <View style={styles.brandBadge}>
            {brandLogo ? (
              <Image source={brandLogo} style={styles.brandLogo} resizeMode="contain" />
            ) : (
              <Text style={styles.brandText}>{item.brandName}</Text>
            )}
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Categoría</Text>
            <Text style={styles.detailValue}>{item.categoryName}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Precio Sug.</Text>
            <Text style={styles.detailValue}>L. 184.50</Text>
          </View>
        </View>

        <View style={styles.warehouseSection}>
          <Text style={styles.warehouseTitle}>Disponibilidad por Bodega:</Text>
          {item.warehouses.map((wh, idx) => (
            <View key={idx} style={styles.warehouseRow}>
              <Text style={styles.warehouseName}>{wh.name} ({wh.code})</Text>
              <Text style={[styles.warehouseQty, wh.quantity > 0 ? { color: tokens.colors.primary } : { color: tokens.colors.gray400 }]}>
                {wh.quantity} und.
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>L. {item.price || '184.50'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <MaterialCommunityIcons name={statusIcon} size={14} color="#fff" />
            <Text style={styles.statusText}>Total: {item.totalStock}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }
  const List = FlashList as any

  return (
    <List
      data={data}

      renderItem={renderItem}
      onRefresh={onRefresh}
      refreshing={refreshing}
      contentContainerStyle={styles.list}
      estimatedItemSize={220}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="package-variant" size={48} color={tokens.colors.gray200} />
          <Text style={styles.emptyText}>No se encontraron productos.</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  list: { padding: tokens.spacing[4], paddingBottom: 100 },
  card: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing[4],
    marginBottom: tokens.spacing[4],
    ...tokens.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing[3],
  },
  titleWrapper: { flex: 1, marginRight: tokens.spacing[2] },
  skuText: {
    fontSize: tokens.typography.size.xs,
    color: tokens.colors.gray400,
    fontWeight: tokens.typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.gray900,
  },
  brandBadge: {
    backgroundColor: tokens.colors.gray50,
    padding: tokens.spacing[1],
    borderRadius: tokens.radius.sm,
  },
  brandLogo: {
    width: 60,
    height: 18,
  },
  brandText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: tokens.colors.gray400,
  },
  detailsGrid: {
    flexDirection: 'row',
    paddingVertical: tokens.spacing[2],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.colors.gray100 + '30',
    marginBottom: tokens.spacing[3],
  },
  detailItem: { flex: 1 },
  detailLabel: {
    fontSize: 10,
    color: tokens.colors.gray400,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: tokens.typography.size.xs,
    fontWeight: tokens.typography.weight.semibold,
    color: tokens.colors.gray900,
  },
  warehouseSection: {
    marginBottom: tokens.spacing[3],
  },
  warehouseTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: tokens.colors.gray600,
    marginBottom: tokens.spacing[2],
  },
  warehouseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  warehouseName: {
    fontSize: 11,
    color: tokens.colors.gray800,
  },
  warehouseQty: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacing[1],
    paddingTop: tokens.spacing[2],
    borderTopWidth: 1,
    borderColor: tokens.colors.gray100 + '30',
  },
  priceText: {
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: 4,
    borderRadius: tokens.radius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.spacing[12],
  },
  emptyText: {
    marginTop: tokens.spacing[4],
    color: tokens.colors.gray400,
    fontSize: tokens.typography.size.base,
  },
})
