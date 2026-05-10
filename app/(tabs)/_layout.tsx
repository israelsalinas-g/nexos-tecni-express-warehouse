import { Tabs } from 'expo-router'
import { Image, View, Platform } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarInactiveTintColor: tokens.colors.gray400,
        tabBarStyle: { 
          borderTopColor: tokens.colors.gray100,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingBottom: Platform.OS === 'ios' ? 30 : 14,
          paddingTop: 10,
          backgroundColor: tokens.colors.bgLight,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
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
            <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Escanear',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="barcode-scan" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventario',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant-closed" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Órdenes',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="transfers"
        options={{
          title: 'Traslados',
          href: null, // Hide from tab bar
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="swap-horizontal" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="auxiliaries"
        options={{
          title: 'Auxiliares',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="database-cog-outline" color={color} size={size} />
          ),
        }}
      />

    </Tabs>

  )
}


