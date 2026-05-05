import { View, Text, StyleSheet } from 'react-native'
import { StockBadge } from './StockBadge'

interface StockByWarehouse {
  warehouseId: string
  warehouseName: string
  quantity: number
  stockMin: number
}

interface Props {
  name: string
  sku: string
  brand?: string
  stock: StockByWarehouse[]
}

export function ProductCard({ name, sku, brand, stock }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          <Text style={styles.meta}>SKU: {sku}{brand ? `  •  ${brand}` : ''}</Text>
        </View>
      </View>

      <View style={styles.stockSection}>
        <Text style={styles.stockLabel}>Stock por bodega</Text>
        {stock.length === 0 ? (
          <Text style={styles.empty}>Sin registros de inventario</Text>
        ) : (
          stock.map((s) => (
            <View key={s.warehouseId} style={styles.stockRow}>
              <Text style={styles.warehouseName}>{s.warehouseName}</Text>
              <StockBadge quantity={s.quantity} stockMin={s.stockMin} />
            </View>
          ))
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  info:   { flex: 1 },
  name:   { fontSize: 16, fontWeight: '600', color: '#111827' },
  meta:   { fontSize: 13, color: '#6b7280', marginTop: 2 },
  stockSection: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  stockLabel:   { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  warehouseName: { fontSize: 14, color: '#374151', flex: 1 },
  empty: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic' },
})
