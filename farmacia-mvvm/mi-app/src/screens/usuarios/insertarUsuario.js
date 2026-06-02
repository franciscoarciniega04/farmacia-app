// src/screens/usuarios/InsertarUsuarioScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatabaseService from '../../services/dataService';
import { API_BASE_URL } from '../../constants/config';

export default function InsertarUsuarioScreen({ route, navigation }) {
  const { usuarioActivo, usuario: usuarioInicial, onUsuarioGuardado } =
    route.params || {};

  // Estado del formulario
  const [usuario, setUsuario] = useState({
    nombre: '',
    apellido: '',
    username: '',
    password: '',
    idRol: '',
    estatus: true,
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [modalRolVisible, setModalRolVisible] = useState(false);
  const esEdicion = !!usuarioInicial;
  const esUsuarioActivo =
    usuarioActivo &&
    usuarioInicial &&
    usuarioActivo.idUsuario === usuarioInicial.idUsuario;

  // Estados offline
  const [isOnline, setIsOnline] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    await DatabaseService.init();
    const status = await DatabaseService.getStatus();
    setIsOnline(status.isOnline);

    cargarRoles();
    if (usuarioInicial) {
      setUsuario({
        nombre: usuarioInicial.nombre || '',
        apellido: usuarioInicial.apellido || '',
        username: usuarioInicial.username || '',
        password: '', // No cargar password por seguridad
        idRol: usuarioInicial.idRol?.toString() || '',
        estatus: usuarioInicial.estatus === 1,
      });
    }
  };

  // Cargar roles
  const cargarRoles = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/roles/`);
      if (!resp.ok) throw new Error('Error al cargar roles');
      const data = await resp.json();
      setRoles(data);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los roles');
    }
  };

  // Manejar cambios en campos
  const handleChange = (field, value) => {
    setUsuario((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Obtener texto del rol seleccionado
  const getTextoRolSeleccionado = () => {
    if (!usuario.idRol) return 'Seleccionar rol';
    const rol = roles.find((r) => r.idRol === parseInt(usuario.idRol));
    return rol ? rol.rol : 'Seleccionar rol';
  };

  // Guardar usuario
  const handleGuardar = async () => {
    // Validaciones
    if (
      !usuario.nombre ||
      !usuario.apellido ||
      !usuario.username ||
      !usuario.idRol
    ) {
      Alert.alert('Error', 'Completa todos los campos obligatorios');
      return;
    }

    if (!esEdicion && !usuario.password) {
      Alert.alert('Error', 'La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    if (usuario.password && usuario.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const body = {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      username: usuario.username,
      idRol: parseInt(usuario.idRol),
      estatus: usuario.estatus ? 1 : 0,
    };

    // Solo incluir password si se proporcionó
    if (usuario.password) {
      body.password = usuario.password;
    }

    setLoading(true);
    try {
      const online = await DatabaseService.checkConnection();

      if (online) {
        // Guardar en servidor
        const url = esEdicion
          ? `${API_BASE_URL}/usuarios/${usuarioInicial.idUsuario}`
          : `${API_BASE_URL}/usuarios/`;
        const method = esEdicion ? 'PUT' : 'POST';

        const resp = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          const error = await resp.json();
          throw new Error(error.detail || 'Error al guardar usuario');
        }

        Alert.alert(
          'Éxito',
          esEdicion
            ? '¡Usuario actualizado correctamente!'
            : '¡Usuario creado correctamente!',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onUsuarioGuardado) onUsuarioGuardado();
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        // Agregar a cola de sincronización
        await DatabaseService.addToSyncQueue({
          type: 'usuario',
          endpoint: esEdicion
            ? `/usuarios/${usuarioInicial.idUsuario}`
            : '/usuarios/',
          method: esEdicion ? 'PUT' : 'POST',
          data: body,
        });

        Alert.alert(
          'Guardado Offline',
          'El usuario se guardó localmente y se sincronizará cuando haya conexión.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar usuario
  const handleEliminar = () => {
    if (!usuarioInicial) return;

    if (esUsuarioActivo) {
      Alert.alert('Error', 'No puedes eliminar tu propio usuario');
      return;
    }

    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro de eliminar este usuario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: async () => {
            setLoading(true);
            try {
              const online = await DatabaseService.checkConnection();

              if (online) {
                const resp = await fetch(
                  `${API_BASE_URL}/usuarios/${usuarioInicial.idUsuario}`,
                  { method: 'DELETE' }
                );

                if (!resp.ok) throw new Error('Error al eliminar usuario');

                Alert.alert('Éxito', 'Usuario eliminado correctamente', [
                  {
                    text: 'OK',
                    onPress: () => {
                      if (onUsuarioGuardado) onUsuarioGuardado();
                      navigation.goBack();
                    },
                  },
                ]);
              } else {
                await DatabaseService.addToSyncQueue({
                  type: 'usuario_delete',
                  endpoint: `/usuarios/${usuarioInicial.idUsuario}`,
                  method: 'DELETE',
                  data: {},
                });

                Alert.alert(
                  'Eliminación Pendiente',
                  'El usuario se eliminará cuando haya conexión.',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              }
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color="#2f4f7a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {esEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Text>
          <TouchableOpacity onPress={handleGuardar} style={styles.headerButton}>
            {loading ? (
              <ActivityIndicator size="small" color="#3477eb" />
            ) : (
              <Ionicons name="checkmark" size={28} color="#3477eb" />
            )}
          </TouchableOpacity>
        </View>

        {/* Indicador de estado de conexión */}
        <View style={[styles.connectionBar, !isOnline && styles.connectionBarOffline]}>
          <Ionicons
            name={isOnline ? 'cloud-done' : 'cloud-offline'}
            size={16}
            color="#fff"
          />
          <Text style={styles.connectionText}>
            {isOnline ? 'Conectado' : 'Modo Offline - Los cambios se sincronizarán'}
          </Text>
        </View>

        <ScrollView style={styles.content}>
          {esUsuarioActivo && (
            <View style={styles.warningBanner}>
              <Ionicons name="information-circle" size={24} color="#3477eb" />
              <Text style={styles.warningText}>
                Estás editando tu propio usuario
              </Text>
            </View>
          )}

          {/* Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nombre <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={usuario.nombre}
              onChangeText={(value) => handleChange('nombre', value)}
              placeholder="Nombre del usuario"
              placeholderTextColor="#999"
            />
          </View>

          {/* Apellido */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Apellido <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={usuario.apellido}
              onChangeText={(value) => handleChange('apellido', value)}
              placeholder="Apellido del usuario"
              placeholderTextColor="#999"
            />
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Username <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, esEdicion && styles.inputDisabled]}
              value={usuario.username}
              onChangeText={(value) => handleChange('username', value)}
              placeholder="Nombre de usuario"
              placeholderTextColor="#999"
              autoCapitalize="none"
              editable={!esEdicion}
            />
            {esEdicion && (
              <Text style={styles.helperText}>
                El username no se puede cambiar
              </Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Contraseña {!esEdicion && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={usuario.password}
                onChangeText={(value) => handleChange('password', value)}
                placeholder={
                  esEdicion
                    ? 'Dejar vacío para no cambiar'
                    : 'Mínimo 6 caracteres'
                }
                placeholderTextColor="#999"
                secureTextEntry={!mostrarPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setMostrarPassword(!mostrarPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={mostrarPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Rol */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Rol <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setModalRolVisible(true)}
            >
              <Text
                style={[
                  styles.selectorText,
                  !usuario.idRol && styles.selectorPlaceholder,
                ]}
              >
                {getTextoRolSeleccionado()}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#3477eb" />
            </TouchableOpacity>
          </View>

          {/* Estatus */}
          <View style={styles.switchGroup}>
            <Text style={styles.label}>
              Estatus: {usuario.estatus ? 'Habilitado' : 'Deshabilitado'}
            </Text>
            <Switch
              value={usuario.estatus}
              onValueChange={(value) => handleChange('estatus', value)}
              trackColor={{ false: '#ccc', true: '#3477eb' }}
              thumbColor={usuario.estatus ? '#fff' : '#f4f3f4'}
              disabled={esUsuarioActivo}
            />
          </View>

          {esUsuarioActivo && (
            <Text style={styles.helperText}>
              No puedes deshabilitar tu propio usuario
            </Text>
          )}

          {/* Botón eliminar (solo en edición y si no es usuario activo) */}
          {esEdicion && !esUsuarioActivo && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleEliminar}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Eliminar Usuario</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Modal Rol */}
        <Modal
          visible={modalRolVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalRolVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setModalRolVisible(false)}
                  style={styles.modalBackButton}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Rol</Text>
                <View style={{ width: 28 }} />
              </View>
              <ScrollView style={styles.modalContent}>
                {roles.map((rol) => (
                  <TouchableOpacity
                    key={rol.idRol}
                    style={styles.modalItem}
                    onPress={() => {
                      handleChange('idRol', rol.idRol.toString());
                      setModalRolVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{rol.rol}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f7ff',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  headerButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2f4f7a',
  },
  connectionBar: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  connectionBarOffline: {
    backgroundColor: '#fa3a3a',
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#3477eb',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#fa3a3a',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#e9ecef',
    color: '#6c757d',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  eyeButton: {
    padding: 12,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 14,
  },
  selectorText: {
    fontSize: 14,
    color: '#333',
  },
  selectorPlaceholder: {
    color: '#999',
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fa3a3a',
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#3477eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalBackButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalContent: {
    maxHeight: 500,
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecef',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
});
