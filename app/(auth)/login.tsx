import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, 
  Platform, Image,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { tokens } from '@/theme/tokens'

export default function LoginScreen() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y contraseña.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setLoading(false)
      Alert.alert('Error de acceso', 'Credenciales inválidas. Verifica tu correo y contraseña.')
      return
    }

    // Verify this user is a warehouse admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    // Assuming role 'staff' or similar has warehouse access
    if (profileError || (profile?.role !== 'admin' && profile?.role !== 'staff')) {
      await supabase.auth.signOut()
      setLoading(false)
      Alert.alert(
        'Acceso denegado',
        'Esta app es exclusiva para personal autorizado de bodega.',
      )
      return
    }

    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <View style={styles.logoWrapper}>
          <Image 
            source={require('@/assets/site/logo_tecni_express.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.title}>Sistema de Bodega</Text>
        <Text style={styles.subtitle}>Gestión de Inventario y Traslados</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor={tokens.colors.gray400}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={tokens.colors.gray400}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Iniciar Sesión</Text>}
        </TouchableOpacity>
      </View>
      
      <Text style={styles.footer}>© {new Date().getFullYear()} Nexos Tecni-Express</Text>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.bgScreen,
    justifyContent: 'center',
    padding: tokens.spacing[6],
  },
  card: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius['2xl'] || 24,
    padding: tokens.spacing[8],
    ...tokens.shadow.lg,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: tokens.spacing[6],
  },
  logo: {
    width: 200,
    height: 80,
  },
  title: {
    fontSize: tokens.typography.size.xl,
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.gray900,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: tokens.typography.size.base,
    color: tokens.colors.gray600,
    textAlign: 'center',
    marginBottom: tokens.spacing[8],
    marginTop: tokens.spacing[1],
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    fontSize: tokens.typography.size.base,
    color: tokens.colors.gray900,
    marginBottom: tokens.spacing[4],
    backgroundColor: tokens.colors.gray50,
  },
  button: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.spacing[4],
    alignItems: 'center',
    marginTop: tokens.spacing[2],
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#fff',
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.bold,
  },
  footer: {
    textAlign: 'center',
    marginTop: tokens.spacing[10],
    color: tokens.colors.gray400,
    fontSize: tokens.typography.size.xs,
  },
})

