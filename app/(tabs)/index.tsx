import React, { useEffect, useState } from 'react'
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Image, Dimensions,
  ActivityIndicator,
  RefreshControl,
  ImageBackground
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { supabase } from '@/lib/supabase'
import { FiscalService } from '@/services/fiscal.service'

const { width } = Dimensions.get('window')

export default function InicioScreen() {
  const router = useRouter()
  const [userName, setUserName] = useState('Operador')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fiscalAlerts, setFiscalAlerts] = useState<any[] | null>(null)

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(' ')[0])
      }

      // Load fiscal alerts
      const alerts = await FiscalService.getFiscalAlerts()
      setFiscalAlerts(alerts)

    } catch (error) {
      console.error('Inicio data error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const menuItems = [
    {
      id: 'sales',
      title: 'Ventas',
      subtitle: 'Facturación y POS',
      icon: 'cash-register',
      color: tokens.colors.primary,
      route: '/(tabs)/sales'
    },
    {
      id: 'inventory',
      title: 'Productos',
      subtitle: 'Consultar Stock',
      icon: 'package-variant-closed',
      color: tokens.colors.tertiary,
      route: '/(tabs)/inventory'
    },
    {
      id: 'quotations',
      title: 'Cotizaciones',
      subtitle: 'Presupuestos',
      icon: 'file-document-outline',
      color: '#0ea5e9',
      route: '/(tabs)/quotations'
    },
    {
      id: 'shipments',
      title: 'Envíos',
      subtitle: 'Logística',
      icon: 'truck-fast-outline',
      color: '#f59e0b',
      route: '/(tabs)/shipments'
    },
    {
      id: 'auxiliaries',
      title: 'Auxiliares',
      subtitle: 'Maestros y CRUDs',
      icon: 'database-cog-outline',
      color: tokens.colors.secondary,
      route: '/(tabs)/auxiliaries'
    },
    {
      id: 'finance',
      title: 'Finanzas',
      subtitle: 'Balance y gastos',
      icon: 'bank-outline',
      color: '#10b981',
      route: '/finance/index'
    },
    {
      id: 'movements',
      title: 'Movimientos',
      subtitle: 'Compras y Traslados',
      icon: 'swap-horizontal-bold',
      color: tokens.colors.onSurfaceVariant,
      route: '/(tabs)/movements'
    },
    {
      id: 'reports',
      title: 'Reportes',
      subtitle: 'Análisis y métricas',
      icon: 'chart-bar',
      color: '#3b82f6',
      route: '/reports/index'
    },
  ]

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />
      }
    >
      {/* Welcome Hero */}
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

      {/* Fiscal Alerts Section */}
      {fiscalAlerts && fiscalAlerts.map((alert, idx) => (
        <TouchableOpacity 
          key={idx}
          style={[
            styles.alertCard, 
            { backgroundColor: alert.severity === 'error' ? tokens.colors.errorContainer : tokens.colors.warning + '15' }
          ]}
          onPress={() => router.push('/auxiliaries/fiscal' as any)}
        >
          <MaterialCommunityIcons 
            name={alert.severity === 'error' ? 'alert-octagon' : 'alert'} 
            size={24} 
            color={alert.severity === 'error' ? tokens.colors.error : tokens.colors.warning} 
          />
          <View style={styles.alertTextContainer}>
            <Text style={[styles.alertMessage, { color: alert.severity === 'error' ? tokens.colors.error : tokens.colors.onSurface }]}>
              {alert.message}
            </Text>
            <Text style={styles.alertSub}>Toca para gestionar CAI</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Quick Actions Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      </View>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity 
          style={styles.quickActionBtn}
          onPress={() => router.push('/(tabs)/sales')}
        >
          <View style={styles.qaIconWrapper}>
            <MaterialCommunityIcons name="point-of-sale" size={24} color={tokens.colors.primary} />
          </View>
          <View>
            <Text style={styles.qaTitle}>POS RÁPIDO</Text>
            <Text style={styles.qaSubtitle}>Facturación</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionBtn}
          onPress={() => router.push('/(tabs)/scan')}
        >
          <View style={[styles.qaIconWrapper, { backgroundColor: tokens.colors.secondaryContainer }]}>
            <MaterialCommunityIcons name="barcode-scan" size={24} color={tokens.colors.onSecondaryContainer} />
          </View>
          <View>
            <Text style={styles.qaTitle}>ESCANEAR</Text>
            <Text style={styles.qaSubtitle}>Consulta</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Grid Navigation */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Módulos Principales</Text>
      </View>
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

      {/* Branding Footer */}
      <View style={styles.footer}>
        <Image 
          source={require('@/assets/site/logo_tecni_express.png')}
          style={styles.footerLogo}
          resizeMode="contain"
        />
        <Text style={styles.versionText}>v1.1.0 • Entorno de Producción</Text>
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
    padding: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.bgScreen,
  },
  heroWrapper: {
    marginBottom: tokens.spacing.lg,
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
    ...tokens.shadow.md,
  },
  hero: {
    width: '100%',
    height: 140,
  },
  heroImage: {
    borderRadius: tokens.radius.xl,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 84, 46, 0.7)',
    padding: tokens.spacing.lg,
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
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    marginBottom: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...tokens.shadow.sm,
  },
  alertTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  alertMessage: {
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.bold,
  },
  alertSub: {
    fontSize: 11,
    color: tokens.colors.onSurfaceVariant,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.onSurface,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: tokens.colors.bgLight,
    borderWidth: 1,
    borderColor: tokens.colors.outlineVariant,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...tokens.shadow.sm,
  },
  qaIconWrapper: {
    padding: 10,
    backgroundColor: tokens.colors.success + '15',
    borderRadius: tokens.radius.md,
  },
  qaTitle: {
    fontSize: 12,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.onSurface,
  },
  qaSubtitle: {
    fontSize: 11,
    color: tokens.colors.onSurfaceVariant,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xl,
  },
  menuItem: {
    width: (width - tokens.spacing.md * 3) / 2,
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.outlineVariant,
    ...tokens.shadow.sm,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  menuTitle: {
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.onSurface,
    textAlign: 'center',
  },
  menuSubtitle: {
    fontSize: 10,
    color: tokens.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
    marginTop: tokens.spacing.xl,
    paddingBottom: tokens.spacing.xl,
    opacity: 0.5,
  },
  footerLogo: {
    width: 120,
    height: 40,
    marginBottom: tokens.spacing.xs,
  },
  versionText: {
    fontSize: 10,
    color: tokens.colors.onSurfaceVariant,
  },
})
