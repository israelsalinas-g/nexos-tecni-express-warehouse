import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, 
  Platform, Image,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { tokens } from '@/theme/tokens'

export default function LoginScreen() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleLogin() {
    const cleanEmail = email.trim()
    console.log('Login attempt started for:', cleanEmail)
    
    if (!cleanEmail || !password) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y contraseña.')
      return
    }

    setLoading(true)
    try {
      console.log('Calling signInWithPassword...')
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: cleanEmail, 
        password 
      })

      if (error) {
        console.log('Auth error:', error.message)
        setLoading(false)
        Alert.alert('Error de acceso', error.message || 'Credenciales inválidas.')
        return
      }

      if (!data.user) {
        console.log('No user data returned')
        setLoading(false)
        Alert.alert('Error', 'No se pudo obtener la información del usuario.')
        return
      }

      console.log('Auth success. User ID:', data.user.id)
      console.log('Fetching profile...')

      // Verify this user is a warehouse admin or superadmin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, admin_role')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.log('Profile fetch error:', profileError.message)
        await supabase.auth.signOut()
        setLoading(false)
        Alert.alert('Error de perfil', 'No se pudo verificar tus permisos: ' + profileError.message)
        return
      }

      console.log('Profile found:', profile)

      if (!profile?.is_admin || (profile.admin_role !== 'superadmin' && profile.admin_role !== 'warehouse' && profile.admin_role !== 'sales')) {
        console.log('Access denied. Role:', profile?.admin_role, 'is_admin:', profile?.is_admin)
        await supabase.auth.signOut()
        setLoading(false)
        Alert.alert(
          'Acceso denegado',
          'Esta app es exclusiva para personal autorizado de bodega.',
        )
        return
      }

      console.log('Login successful!')
      setLoading(false)
    } catch (err: any) {
      console.error('CRITICAL LOGIN ERROR:', err)
      setLoading(false)
      Alert.alert('Error inesperado', err.message || 'Ocurrió un error al intentar iniciar sesión.')
    }
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

        <View style={styles.inputContainer}>
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
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={tokens.colors.gray400}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
          />
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
            accessible
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <MaterialCommunityIcons 
              name={showPassword ? "eye-off" : "eye"} 
              size={22} 
              color={tokens.colors.gray400} 
            />
          </TouchableOpacity>
        </View>

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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing[4],
    backgroundColor: tokens.colors.gray50,
    borderWidth: 1,
    borderColor: tokens.colors.gray200,
    borderRadius: tokens.radius.lg,
  },
  input: {
    flex: 1,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    fontSize: tokens.typography.size.base,
    color: tokens.colors.gray900,
  },
  eyeIcon: {
    paddingHorizontal: tokens.spacing[3],
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


