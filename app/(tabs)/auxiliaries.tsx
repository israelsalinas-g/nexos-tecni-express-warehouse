import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { useRouter } from 'expo-router'

const { width } = Dimensions.get('window')
const COLUMN_WIDTH = (width - 40 - 16) / 2 // 40 (padding horizontal) - 16 (gap)

export default function AuxiliariesScreen() {
  const router = useRouter()

  const menuItems = [
    {
      id: 'customers',
      title: 'Clientes',
      icon: 'account-group-outline',
      color: '#10b981', // Emerald
      route: '/auxiliaries/customers'
    },
    {
      id: 'suppliers',
      title: 'Proveedores',
      icon: 'truck-delivery-outline',
      color: '#f59e0b', // Amber
      route: '/auxiliaries/suppliers'
    },
    {
      id: 'brands',
      title: 'Marcas',
      icon: 'tag-multiple-outline',
      color: '#3b82f6', // Blue
      route: '/auxiliaries/brands'
    },
    {
      id: 'categories',
      title: 'Categorías',
      icon: 'shape-outline',
      color: '#8b5cf6', // Violet
      route: '/auxiliaries/categories'
    },
    {
      id: 'warehouses',
      title: 'Bodegas',
      icon: 'warehouse',
      color: '#ef4444', // Red
      route: '/auxiliaries/warehouses'
    },
    {
      id: 'carriers',
      title: 'Transportistas',
      icon: 'truck-delivery-outline',
      color: '#3b82f6', // Blue
      route: '/auxiliaries/carriers'
    }
  ]



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Auxiliares</Text>
          <Text style={styles.subtitle}>Gestión de datos maestros</Text>
        </View>

        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.squareCard}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={20} color={tokens.colors.primary} />
          <Text style={styles.infoText}>
            Usa este panel para configurar los datos básicos que alimentan el inventario y las órdenes.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.bgScreen,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    marginTop: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: tokens.colors.gray900,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: tokens.colors.gray600,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  squareCard: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...tokens.shadow.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.gray900,
    textAlign: 'center',
  },
  infoBox: {
    marginTop: 24,
    backgroundColor: tokens.colors.primary + '08',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.primary + '20',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: tokens.colors.primary,
    lineHeight: 18,
  }
})

