import React, { useEffect, useState } from 'react'
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Alert, ActivityIndicator, Modal, TextInput, SafeAreaView,
  ScrollView, Switch
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { tokens } from '@/theme/tokens'
import { ProfileService } from '@/services/profile.service'
import { Profile } from '@/types/database.types'
import { useRouter } from 'expo-router'

const ADMIN_ROLES = [
  { label: 'Super Administrador', value: 'superadmin', color: tokens.colors.primary },
  { label: 'Gestor de Almacén', value: 'warehouse', color: tokens.colors.tertiary },
  { label: 'Vendedor', value: 'sales', color: tokens.colors.info },
]

export default function UsersScreen() {
  const router = useRouter()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<Partial<Profile> | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await ProfileService.getAdmins()
      setUsers(data)
    } catch (error) {
      console.error(error)
      Alert.alert('Error', 'No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleEdit = (user: Profile) => {
    setEditingUser(user)
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!editingUser?.id) return
    
    try {
      setSaving(true)
      await ProfileService.update(editingUser.id, {
        admin_role: editingUser.admin_role,
        is_admin: editingUser.is_admin,
        full_name: editingUser.full_name
      })
      
      Alert.alert('Éxito', 'Usuario actualizado correctamente')
      setModalVisible(false)
      fetchUsers()
    } catch (error) {
      console.error(error)
      Alert.alert('Error', 'No se pudo actualizar el usuario')
    } finally {
      setSaving(false)
    }
  }

  const getRoleLabel = (role?: string | null) => {
    return ADMIN_ROLES.find(r => r.value === role)?.label || 'Sin Rol'
  }

  const getRoleColor = (role?: string | null) => {
    return ADMIN_ROLES.find(r => r.value === role)?.color || tokens.colors.gray400
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tokens.colors.gray900} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Usuarios</Text>
          <Text style={styles.subtitle}>Gestión de accesos y roles</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={tokens.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={[styles.avatar, { backgroundColor: getRoleColor(item.admin_role) + '20' }]}>
                  <Text style={[styles.avatarText, { color: getRoleColor(item.admin_role) }]}>
                    {item.full_name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.userName}>{item.full_name}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.admin_role) + '15' }]}>
                    <Text style={[styles.roleText, { color: getRoleColor(item.admin_role) }]}>
                      {getRoleLabel(item.admin_role)}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
                <MaterialCommunityIcons name="pencil-outline" size={20} color={tokens.colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-search-outline" size={64} color={tokens.colors.gray100} />
              <Text style={styles.emptyText}>No se encontraron usuarios administradores</Text>
            </View>
          }
        />
      )}

      {/* Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Usuario</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={tokens.colors.gray400} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <View style={styles.field}>
                <Text style={styles.label}>Nombre Completo</Text>
                <TextInput 
                  style={styles.input}
                  value={editingUser?.full_name}
                  onChangeText={(text) => setEditingUser(prev => ({ ...prev!, full_name: text }))}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email (Solo lectura)</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: tokens.colors.gray50, color: tokens.colors.gray400 }]}
                  value={editingUser?.email}
                  editable={false}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Rol Administrativo</Text>
                <View style={styles.rolesGrid}>
                  {ADMIN_ROLES.map((role) => (
                    <TouchableOpacity 
                      key={role.value}
                      style={[
                        styles.roleOption, 
                        editingUser?.admin_role === role.value && { borderColor: role.color, backgroundColor: role.color + '08' }
                      ]}
                      onPress={() => setEditingUser(prev => ({ ...prev!, admin_role: role.value }))}
                    >
                      <MaterialCommunityIcons 
                        name={editingUser?.admin_role === role.value ? "radiobox-marked" : "radiobox-blank"} 
                        size={20} 
                        color={editingUser?.admin_role === role.value ? role.color : tokens.colors.gray200} 
                      />
                      <Text style={[
                        styles.roleOptionLabel, 
                        editingUser?.admin_role === role.value && { color: role.color, fontWeight: '700' }
                      ]}>
                        {role.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.field, styles.switchField]}>
                <View>
                  <Text style={styles.label}>Acceso Administrativo</Text>
                  <Text style={styles.switchDesc}>Permitir acceso a la web/app warehouse</Text>
                </View>
                <Switch 
                  value={editingUser?.is_admin}
                  onValueChange={(val) => setEditingUser(prev => ({ ...prev!, is_admin: val }))}
                  trackColor={{ false: tokens.colors.gray200, true: tokens.colors.primary + '80' }}
                  thumbColor={editingUser?.is_admin ? tokens.colors.primary : tokens.colors.gray100}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Guardar Cambios</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.bgScreen },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray100
  },
  backBtn: { marginRight: 16 },
  title: { fontSize: 22, fontWeight: '800', color: tokens.colors.gray900 },
  subtitle: { fontSize: 13, color: tokens.colors.gray400 },
  listContent: { padding: 16 },
  userCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...tokens.shadow.sm
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { fontSize: 20, fontWeight: '800' },
  userName: { fontSize: 16, fontWeight: '700', color: tokens.colors.gray900 },
  userEmail: { fontSize: 13, color: tokens.colors.gray400 },
  roleBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    alignSelf: 'flex-start',
    marginTop: 6
  },
  roleText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  editBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: tokens.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyState: { alignItems: 'center', marginTop: 80, opacity: 0.5 },
  emptyText: { marginTop: 12, fontSize: 14, color: tokens.colors.gray400, textAlign: 'center' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    height: '85%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray50
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: tokens.colors.gray900 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: tokens.colors.gray600, marginBottom: 8 },
  input: {
    backgroundColor: tokens.colors.gray50,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: tokens.colors.gray100
  },
  rolesGrid: { gap: 10 },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.gray100,
    backgroundColor: '#fff'
  },
  roleOptionLabel: { marginLeft: 12, fontSize: 15, color: tokens.colors.gray600 },
  switchField: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: tokens.colors.gray50,
    padding: 16,
    borderRadius: 16
  },
  switchDesc: { fontSize: 12, color: tokens.colors.gray400, marginTop: 2 },
  saveBtn: {
    backgroundColor: tokens.colors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
})
