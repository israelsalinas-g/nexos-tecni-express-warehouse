import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { InventoryRow } from '@/types/database.types'
import { StockBadge } from '../StockBadge'

interface Props {
  data: InventoryRow[]
  onPressItem?: (item: InventoryRow) => void
  onRefresh?: () => void
  refreshing?: boolean
}

export const InventoryList: React.FC<Props> = ({ 
  data, 
  onPressItem, 
  onRefresh, 
  refreshing 
}) => {
  const renderItem = ({ item }: { item: InventoryRow }) => (
    <Pressable 
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => onPressItem?.(item)}
    >
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{item.product.name_es}</Text>
        <Text style={styles.rowSku}>{item.product.sku}</Text>
      </View>
      <StockBadge quantity={item.quantity} stockMin={item.stock_min} />
    </Pressable>
  )

  return (
    <FlashList<InventoryRow>
      data={data}
      renderItem={renderItem}
      onRefresh={onRefresh}
      refreshing={refreshing}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <Text style={styles.empty}>No se encontraron resultados.</Text>
      }
    />
  )
}



const styles = StyleSheet.create({
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 14 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    // Subtle shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  rowPressed: { backgroundColor: '#f9fafb', opacity: 0.8 },
  rowInfo:  { flex: 1, marginRight: 12 },
  rowName:  { fontSize: 16, color: '#111827', fontWeight: '600' },
  rowSku:   { fontSize: 13, color: '#6b7280', marginTop: 2, fontWeight: '400' },
})
