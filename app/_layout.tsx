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
      <Stack.Screen name="quotations/index" options={{ headerShown: false }} />
      <Stack.Screen name="quotations/[id]" options={{ headerShown: true, title: 'Cotización' }} />
      <Stack.Screen name="quotations/new" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="quotations/edit/[id]" options={{ headerShown: false, presentation: 'modal' }} />

      {/* F2 — Shipments */}
      <Stack.Screen name="shipments/index" options={{ headerShown: false }} />
      <Stack.Screen name="shipments/[id]" options={{ headerShown: true, title: 'Envío' }} />
      <Stack.Screen name="shipments/new" options={{ headerShown: false, presentation: 'modal' }} />

      {/* F3 — Finance */}
      <Stack.Screen name="finance/index" options={{ headerShown: false }} />
      <Stack.Screen name="finance/expenses/index" options={{ headerShown: false }} />
      <Stack.Screen name="finance/expenses/new" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="finance/receivables/index" options={{ headerShown: false }} />
      <Stack.Screen name="finance/payables/index" options={{ headerShown: false }} />
      <Stack.Screen name="finance/balance/index" options={{ headerShown: false }} />

      {/* F4 — Credit */}
      <Stack.Screen name="credit/index" options={{ headerShown: false }} />
      <Stack.Screen name="credit/[accountId]" options={{ headerShown: true, title: 'Cuenta de Crédito' }} />
      <Stack.Screen name="credit/new" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="credit/payment/[accountId]" options={{ headerShown: false, presentation: 'modal' }} />

      {/* F4 — Loyalty */}
      <Stack.Screen name="loyalty/index" options={{ headerShown: false }} />
      <Stack.Screen name="loyalty/[accountId]" options={{ headerShown: true, title: 'Programa de Fidelidad' }} />
      <Stack.Screen name="loyalty/adjust/[accountId]" options={{ headerShown: false, presentation: 'modal' }} />

      {/* F5 — Service tickets */}
      <Stack.Screen name="service/index" options={{ headerShown: false }} />
      <Stack.Screen name="service/[ticketId]" options={{ headerShown: true, title: 'Ticket de Servicio' }} />
      <Stack.Screen name="service/new" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="service/parts/[ticketId]" options={{ headerShown: false, presentation: 'modal' }} />

      {/* F6 — Reports */}
      <Stack.Screen name="reports/index" options={{ headerShown: false }} />
      <Stack.Screen name="reports/sales" options={{ headerShown: true, title: 'Reporte de Ventas' }} />
      <Stack.Screen name="reports/inventory" options={{ headerShown: true, title: 'Reporte de Inventario' }} />
      <Stack.Screen name="reports/finance" options={{ headerShown: true, title: 'Reporte Financiero' }} />

      {/* F7 — Compatibility & Audit */}
      <Stack.Screen name="compatibility/index" options={{ headerShown: false }} />
      <Stack.Screen name="compatibility/models/index" options={{ headerShown: false }} />
      <Stack.Screen name="audit/index" options={{ headerShown: false }} />
    </Stack>
  )
}
