import { useState, useEffect } from 'react'
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, TextInput,
  KeyboardAvoidingView, Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { CompanyService } from '@/services/company.service'
import { CompanyProfile } from '@/types/database.types'

export default function CompanyProfileScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({
    business_name: '',
    rtn: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    legal_representative: '',
    legal_rep_position: '',
    legal_rep_phone: '',
    legal_rep_email: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await CompanyService.getProfile()
      if (data) setFormData(data)
    } catch (error) {
      console.error(error)
    } finally {
      setFetching(false)
    }
  }

  const handleSave = async () => {
    if (!formData.business_name || !formData.rtn) {
      Alert.alert('Error', 'Razón Social y RTN son obligatorios.')
      return
    }

    setLoading(true)
    try {
      await CompanyService.updateProfile(formData)
      Alert.alert('Éxito', 'Datos de la empresa actualizados correctamente.')
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={tokens.colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.title}>Datos de la Empresa</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color={tokens.colors.primary} /> : 
              <Text style={styles.saveBtn}>Guardar</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* General Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información General</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Razón Social *</Text>
              <TextInput 
                style={styles.input}
                value={formData.business_name}
                onChangeText={(v) => setFormData({...formData, business_name: v})}
                placeholder="Nombre legal de la empresa"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>RTN *</Text>
              <TextInput 
                style={styles.input}
                value={formData.rtn}
                onChangeText={(v) => setFormData({...formData, rtn: v})}
                placeholder="Registro Tributario Nacional"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dirección Fiscal</Text>
              <TextInput 
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(v) => setFormData({...formData, address: v})}
                placeholder="Dirección completa"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput 
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(v) => setFormData({...formData, phone: v})}
                  placeholder="2200-0000"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Email Contacto</Text>
                <TextInput 
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(v) => setFormData({...formData, email: v})}
                  placeholder="info@empresa.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sitio Web</Text>
              <TextInput 
                style={styles.input}
                value={formData.website}
                onChangeText={(v) => setFormData({...formData, website: v})}
                placeholder="https://www.empresa.com"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Legal Representative */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Representante Legal</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre Completo</Text>
              <TextInput 
                style={styles.input}
                value={formData.legal_representative}
                onChangeText={(v) => setFormData({...formData, legal_representative: v})}
                placeholder="Nombre del representante"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cargo</Text>
              <TextInput 
                style={styles.input}
                value={formData.legal_rep_position}
                onChangeText={(v) => setFormData({...formData, legal_rep_position: v})}
                placeholder="Gerente General, etc."
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Teléfono Rep.</Text>
                <TextInput 
                  style={styles.input}
                  value={formData.legal_rep_phone}
                  onChangeText={(v) => setFormData({...formData, legal_rep_phone: v})}
                  placeholder="Teléfono personal/oficina"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Email Rep.</Text>
                <TextInput 
                  style={styles.input}
                  value={formData.legal_rep_email}
                  onChangeText={(v) => setFormData({...formData, legal_rep_email: v})}
                  placeholder="email@representante.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100,
  },
  title: { fontSize: 18, fontWeight: '800', color: tokens.colors.gray900 },
  backButton: { padding: 4 },
  saveBtn: { fontSize: 16, fontWeight: '700', color: tokens.colors.primary },
  content: { flex: 1, backgroundColor: tokens.colors.bgScreen, padding: 20 },
  section: { 
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    ...tokens.shadow.sm,
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: tokens.colors.primary, 
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: tokens.colors.gray600, marginBottom: 8 },
  input: {
    backgroundColor: tokens.colors.gray50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: tokens.colors.gray900,
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row' },
})
