import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { useRouter } from 'expo-router'

export default function AuxiliariesScreen() {
  const router = useRouter()

  const menuItems = [
    {
      id: 'brands',
      title: 'Marcas',
      subtitle: 'Gestión de fabricantes',
      icon: 'tag-multiple-outline',
      color: '#3b82f6', // Blue
      route: '/auxiliaries/brands'
    },
    {
      id: 'categories',
      title: 'Categorías',
      subtitle: 'Organización de productos',
      icon: 'shape-outline',
      color: '#8b5cf6', // Violet
      route: '/auxiliaries/categories'
    },
    {
      id: 'customers',
      title: 'Clientes',
      subtitle: 'Directorio de compradores',
      icon: 'account-group-outline',
      color: '#10b981', // Emerald
      route: '/auxiliaries/customers'
    },
    {
      id: 'suppliers',
      title: 'Proveedores',
      subtitle: 'Gestión de suministros',
      icon: 'truck-delivery-outline',
      color: '#f59e0b', // Amber
      route: '/auxiliaries/suppliers'
    },
    {
      id: 'warehouses',
      title: 'Bodegas',
      subtitle: 'Ubicaciones de inventario',
      icon: 'warehouse',
      color: '#ef4444', // Red
      route: '/auxiliaries/warehouses'
    }
  ]


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Auxiliares</Text>
          <Text style={styles.subtitle}>Panel de gestión de datos maestros</Text>
        </View>

        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}

            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={tokens.colors.gray400} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats / Info Section */}
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
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...tokens.shadow.sm,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.gray900,
  },
  cardSubtitle: {
    fontSize: 13,
    color: tokens.colors.gray400,
    marginTop: 2,
  },
  infoBox: {
    marginTop: 40,
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
