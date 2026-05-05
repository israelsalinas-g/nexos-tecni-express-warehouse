import { Tabs } from 'expo-router'
import { Text } from 'react-native'

function Icon({ label }: { label: string }) {
  return <Text style={{ fontSize: 20 }}>{label}</Text>
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#e5e7eb' },
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#111827',
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Escanear',
          tabBarIcon: ({ focused }) => <Icon label={focused ? '📷' : '📷'} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventario',
          tabBarIcon: ({ focused }) => <Icon label={focused ? '📦' : '📦'} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Órdenes',
          tabBarIcon: ({ focused }) => <Icon label={focused ? '🛍️' : '🛍️'} />,
        }}
      />
      <Tabs.Screen
        name="transfers"
        options={{
          title: 'Traslados',
          tabBarIcon: ({ focused }) => <Icon label={focused ? '🔄' : '🔄'} />,
        }}
      />
    </Tabs>
  )
}
