import { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return  // still loading

    const inAuthGroup = segments.includes('(auth)')
    const inTabsGroup = segments.includes('(tabs)')
    
    console.log('Navigation State:', { session: !!session, segments, inAuthGroup, inTabsGroup })

    if (!session && !inAuthGroup) {
      console.log('No session, redirecting to login...')
      router.replace('/(auth)/login')
    } else if (session && (inAuthGroup || !segments.length)) {

      console.log('Session found, redirecting to dashboard...')
      router.replace('/(tabs)')
    }
  }, [session, segments])




  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />

      {/* Existing screens */}
      <Stack.Screen name="receive/[poId]" options={{ headerShown: true, title: 'Recepción de OC' }} />
      <Stack.Screen name="count/[sessionId]" options={{ headerShown: true, title: 'Conteo Físico' }} />
      <Stack.Screen name="product/[sku]" options={{ headerShown: true, title: 'Producto' }} />
      <Stack.Screen name="invoices/new" options={{ headerShown: false, presentation: 'modal' }} />

      {/* F1.2 — Orders */}
      <Stack.Screen name="orders/[orderId]" options={{ headerShown: true, title: 'Pedido' }} />

      {/* F1.3 — Product edit */}
      <Stack.Screen name="product/edit/[sku]" options={{ headerShown: false, presentation: 'modal' }} />

      {/* F2 — Quotations */}
      <Stack.Screen name="quotations/[id]" options={{ headerShown: true, title: 'Cotización' }} />
      <Stack.Screen name="quotations/new" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="quotations/edit/[id]" options={{ headerShown: false, presentation: 'modal' }} />

      {/* F2 — Shipments */}
      <Stack.Screen name="shipments/[id]" options={{ headerShown: true, title: 'Envío' }} />
      <Stack.Screen name="shipments/new" options={{ headerShown: false, presentation: 'modal' }} />

      {/* F3 — Finance */}
      <Stack.Screen name="finance/index" options={{ headerShown: false }} />
      <Stack.Screen name="finance/expenses/index" options={{ headerShown: false }} />
      <Stack.Screen name="finance/expenses/new" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="finance/receivables/index" options={{ headerShown: false }} />
      <Stack.Screen name="finance/payables/index" options={{ headerShown: false }} />
      <Stack.Screen name="finance/balance/index" options={{ headerShown: false }} />

      {/* F6 — Reports */}
      <Stack.Screen name="reports/index" options={{ headerShown: false }} />
      <Stack.Screen name="reports/sales" options={{ headerShown: true, title: 'Reporte de Ventas' }} />
      <Stack.Screen name="reports/inventory" options={{ headerShown: true, title: 'Reporte de Inventario' }} />
      <Stack.Screen name="reports/customers" options={{ headerShown: true, title: 'Reporte de Clientes' }} />
      <Stack.Screen name="reports/finance" options={{ headerShown: true, title: 'Reporte Financiero' }} />

      {/* F7 — Compatibility & Audit removed as files do not exist yet */}
    </Stack>
  )
}
