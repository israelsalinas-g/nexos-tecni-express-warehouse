import React, { useEffect, useState } from 'react'
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Image, ImageBackground,
  Dimensions
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { supabase } from '@/lib/supabase'

const { width } = Dimensions.get('window')

interface QuickStat {
  label: string
  value: string | number
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  color: string
}

export default function HomeScreen() {
  const router = useRouter()
  const [userName, setUserName] = useState('Operador')
  const [stats, setStats] = useState({
    pendingOrders: 0,
    lowStock: 0,
    activeTransfers: 0
  })

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(' ')[0])
      }

      // Simulated stats for dashboard
      // In a real app, these would be real counts from Supabase
      setStats({
        pendingOrders: 12,
        lowStock: 5,
        activeTransfers: 3
      })
    }
    loadData()
  }, [])

  const menuItems = [
    { 
      id: 'scan', 
      title: 'Escanear', 
      subtitle: 'Entradas y Salidas', 
      icon: 'barcode-scan', 
      color: tokens.colors.primary,
      route: '/(tabs)/scan'
    },
    { 
      id: 'inventory', 
      title: 'Inventario', 
      subtitle: 'Consultar Stock', 
      icon: 'package-variant-closed', 
      color: tokens.colors.info,
      route: '/(tabs)/inventory'
    },
    { 
      id: 'orders', 
      title: 'Órdenes', 
      subtitle: 'Despacho y Picking', 
      icon: 'clipboard-text-outline', 
      color: tokens.colors.warning,
      route: '/(tabs)/orders'
    },
    { 
      id: 'transfers', 
      title: 'Traslados', 
      subtitle: 'Movimiento Interno', 
      icon: 'swap-horizontal', 
      color: tokens.colors.secondary,
      route: '/(tabs)/transfers'
    }
  ]

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={styles.heroWrapper}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop' }}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay}>
            <Text style={styles.welcomeText}>¡Hola, {userName}!</Text>
            <Text style={styles.heroSubtitle}>Gestión de Bodega Tecni-Express</Text>
          </View>
        </ImageBackground>
      </View>

      {/* Bento Grid */}
      <View style={styles.grid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrapper, { backgroundColor: item.color + '15' }]}>
              <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
            </View>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Status */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>RESUMEN DE HOY</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={[styles.statusValue, { color: tokens.colors.primary }]}>{stats.pendingOrders}</Text>
            <Text style={styles.statusLabel}>Órdenes</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Text style={[styles.statusValue, { color: tokens.colors.error }]}>{stats.lowStock}</Text>
            <Text style={styles.statusLabel}>Bajo Stock</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Text style={[styles.statusValue, { color: tokens.colors.info }]}>{stats.activeTransfers}</Text>
            <Text style={styles.statusLabel}>Traslados</Text>
          </View>
        </View>
      </View>

      {/* Branding Footer */}
      <View style={styles.footer}>
        <Image 
          source={require('@/assets/site/logo_tecni_express.png')}
          style={styles.footerLogo}
          resizeMode="contain"
        />
        <Text style={styles.versionText}>v1.0.0 • Entorno de Producción</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.bgScreen,
  },
  content: {
    padding: tokens.spacing[4],
    paddingBottom: tokens.spacing[10],
  },
  heroWrapper: {
    marginBottom: tokens.spacing[6],
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
    ...tokens.shadow.md,
  },
  hero: {
    width: '100%',
    height: 160,
  },
  heroImage: {
    borderRadius: tokens.radius.xl,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 84, 46, 0.7)', // Tecni Express Green Overlay
    padding: tokens.spacing[6],
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: tokens.typography.size.xl,
    fontWeight: tokens.typography.weight.bold,
    color: '#fff',
  },
  heroSubtitle: {
    fontSize: tokens.typography.size.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[6],
  },
  menuItem: {
    width: (width - tokens.spacing[4] * 3) / 2,
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing[4],
    marginBottom: tokens.spacing[4],
    alignItems: 'center',
    ...tokens.shadow.sm,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing[3],
  },
  menuTitle: {
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.gray900,
    textAlign: 'center',
  },
  menuSubtitle: {
    fontSize: 10,
    color: tokens.colors.gray400,
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statusSection: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing[5],
    marginBottom: tokens.spacing[6],
    ...tokens.shadow.sm,
  },
  sectionTitle: {
    fontSize: tokens.typography.size.xs,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.gray400,
    letterSpacing: 1,
    marginBottom: tokens.spacing[4],
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusValue: {
    fontSize: tokens.typography.size.xl,
    fontWeight: tokens.typography.weight.extrabold as any,
  },
  statusLabel: {
    fontSize: tokens.typography.size.xs,
    color: tokens.colors.gray600,
    marginTop: 2,
  },
  statusDivider: {
    width: 1,
    height: 40,
    backgroundColor: tokens.colors.gray100,
  },
  footer: {
    alignItems: 'center',
    marginTop: tokens.spacing[4],
    opacity: 0.5,
  },
  footerLogo: {
    width: 120,
    height: 40,
    marginBottom: tokens.spacing[2],
  },
  versionText: {
    fontSize: 10,
    color: tokens.colors.gray400,
  },
})
