import { Tabs } from 'expo-router'
import { Image, View, Platform } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarInactiveTintColor: tokens.colors.gray400,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarStyle: { 
          borderTopColor: tokens.colors.gray100,
          backgroundColor: tokens.colors.bgLight,
          height: Platform.OS === 'ios' ? 88 : 70 + (insets.bottom > 0 ? insets.bottom / 2 : 0),
          paddingBottom: Platform.OS === 'ios' ? 30 : (insets.bottom > 0 ? insets.bottom : 10),
          paddingTop: 10,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },

        headerStyle: { 
          backgroundColor: tokens.colors.bgLight,
        },
        headerTintColor: tokens.colors.gray900,
        headerShadowVisible: false,
        headerTitleStyle: { 
          fontWeight: tokens.typography.weight.extrabold as any,
          fontSize: tokens.typography.size.lg,
        },
        headerRight: () => (
          <View style={{ marginRight: 16 }}>
            <Image 
              source={require('@/assets/site/logo_tecni_express.png')}
              style={{ width: 100, height: 30 }}
              resizeMode="contain"
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant-outline" color={color} size={size + 2} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size + 2} />
          ),
        }}
      />

      <Tabs.Screen
        name="sales"
        options={{
          title: 'Ventas',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash-register" color={color} size={size + 2} />
          ),
        }}
      />

      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Productos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant-closed" color={color} size={size + 2} />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="barcode-scan" color={color} size={size + 2} />
          ),
        }}
      />

      {/* Hidden Tabs (Accessible via navigation but not in bottom bar) */}
      <Tabs.Screen
        name="movements"
        options={{
          title: 'Movimientos',
          href: null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="swap-horizontal-bold" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="auxiliaries"
        options={{
          title: 'Auxiliares',
          href: null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="database-cog-outline" color={color} size={size} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="purchases"
        options={{ title: 'Compras', href: null }}
      />
      
      <Tabs.Screen
        name="transfers"
        options={{ title: 'Traslados', href: null }}
      />

      <Tabs.Screen
        name="quotations"
        options={{ title: 'Cotizaciones', href: null }}
      />

      <Tabs.Screen
        name="shipments"
        options={{ title: 'Envíos', href: null }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configuración',
          href: null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" color={color} size={size} />
          ),
        }}
      />

    </Tabs>
  )
}


