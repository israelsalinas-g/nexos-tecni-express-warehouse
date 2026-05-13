import React from 'react'
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Dimensions, ScrollView
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { tokens } from '@/theme/tokens'

const { width } = Dimensions.get('window')

export default function MovementsScreen() {
  const router = useRouter()

  const items = [
    {
      id: 'purchases',
      title: 'Compras',
      subtitle: 'Entrada de Mercancía',
      icon: 'cart-outline',
      color: '#8b5cf6', // Violet
      route: '/(tabs)/purchases'
    },
    {
      id: 'transfers',
      title: 'Traslados',
      subtitle: 'Entre Bodegas',
      icon: 'swap-horizontal',
      color: tokens.colors.secondary,
      route: '/(tabs)/transfers'
    }
  ]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Movimientos</Text>
          <Text style={styles.subtitle}>Gestión de stock y suministros</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              
              <View style={styles.arrow}>
                <MaterialCommunityIcons name="chevron-right" size={24} color={tokens.colors.gray200} />
              </View>
            </TouchableOpacity>
          ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
    gap: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: tokens.colors.gray900,
  },
  subtitle: {
    fontSize: 12,
    color: tokens.colors.gray400,
    marginTop: 2,
  },
  content: {
    padding: 20,
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...tokens.shadow.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.gray900,
    marginLeft: 16,
    flex: 1,
  },
  cardSubtitle: {
    position: 'absolute',
    left: 100,
    bottom: 20,
    fontSize: 12,
    color: tokens.colors.gray400,
  },
  arrow: {
    marginLeft: 8,
  }
})
