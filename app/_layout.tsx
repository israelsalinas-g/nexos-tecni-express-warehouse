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

    const inAuthGroup = segments[0] === '(auth)'
    console.log('Navigation State:', { session: !!session, segments, inAuthGroup })

    if (!session && !inAuthGroup) {
      console.log('Redirecting to login...')
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      console.log('Redirecting to dashboard...')
      router.replace('/(tabs)')
    }
  }, [session, segments])


  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="receive/[poId]" options={{ headerShown: true, title: 'Recepción de OC' }} />
      <Stack.Screen name="count/[sessionId]" options={{ headerShown: true, title: 'Conteo Físico' }} />
      <Stack.Screen name="product/[sku]" options={{ headerShown: true, title: 'Producto' }} />
    </Stack>
  )
}
