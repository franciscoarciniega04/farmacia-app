// src/screens/ajustes/GestionRolesScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/config';

export default function GestionRolesScreen({ navigation }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [rolEditar, setRolEditar] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });

  useEffect(() => {
    cargarRoles();
  }, []);

  const cargarRoles = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/roles/`);
      if (!resp.ok) throw new Error('Error al cargar roles');
      const data = await resp.json();
      setRoles(data);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los roles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarRoles();
  };

  const abrirModal = (rol = null) => {
    if (rol) {
      setRolEditar(rol);
      setFormData({
        nombre: rol.nombre || '',
        descripcion: rol.descripcion || '',
      });
    } else {
      setRolEditar(null);
      setFormData({ nombre: '', descripcion: '' });
    }
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setRolEditar(null);
    setFormData({ nombre: '', descripcion: '' });
  };

  const handleGuardar = async () => {
    if (!formData.nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      const url = rolEditar
        ? `${API_BASE_URL}/roles/${rolEditar.idRol}`
        : `${API_BASE_URL}/roles/`;
      const method = rolEditar ? 'PUT' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!resp.ok) throw new Error('Error al guardar rol');

      Alert.alert('Éxito', 'Rol guardado correctamente');
      cerrarModal();
      cargarRoles();
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar el rol');
    }
  };

  const handleEliminar = (rol) => {
    Alert.alert(
      'Confirmar',
      `¿Eliminar el rol "${rol.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              const resp = await fetch(
                `${API_BASE_URL}/roles/${rol.idRol}`,
                { method: 'DELETE' }
              );
              if (!resp.ok) throw new Error('Error al eliminar');
              Alert.alert('Éxito', 'Rol eliminado');
              cargarRoles();
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar el rol');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderRolItem = ({ item }) => (
    <View style={styles.rolCard}>
      <View style={styles.iconContainer}>
        <Ionicons name="shield-checkmark" size={32} color="#ffc107" />
      </View>
      <View style={styles.rolInfo}>
        <Text style={styles.rolNombre}>{item.nombre}</Text>
        {item.descripcion && (
          <Text style={styles.rolDescripcion}>{item.descripcion}</Text>
        )}
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => abrirModal(item)}
        >
          <Ionicons name="create" size={20} color="#3477eb" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEliminar(item)}
        >
          <Ionicons name="trash" size={20} color="#fa3a3a" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={26} color="#3477eb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Roles</Text>
          <TouchableOpacity
            onPress={() => abrirModal()}
            style={styles.headerButton}
          >
            <Ionicons name="add-circle" size={32} color="#3477eb" />
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffc107" />
          </View>
        ) : (
          <FlatList
            data={roles}
            renderItem={renderRolItem}
            keyExtractor={(item) => item.idRol.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="shield-checkmark-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No hay roles registrados</Text>
              </View>
            }
          />
        )}

        {/* Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={cerrarModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {rolEditar ? 'Editar Rol' : 'Nuevo Rol'}
                </Text>
                <TouchableOpacity onPress={cerrarModal}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Nombre del Rol *"
                value={formData.nombre}
                onChangeText={(text) =>
                  setFormData({ ...formData, nombre: text })
                }
              />
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Descripción"
                value={formData.descripcion}
                onChangeText={(text) =>
                  setFormData({ ...formData, descripcion: text })
                }
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={cerrarModal}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleGuardar}
                >
                  <Text style={styles.buttonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
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
  listContent: {
    padding: 16,
  },
  rolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#fff9e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rolInfo: {
    flex: 1,
  },
  rolNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2f4f7a',
    marginBottom: 4,
  },
  rolDescripcion: {
    fontSize: 13,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2f4f7a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#aaa',
  },
  saveButton: {
    backgroundColor: '#ffc107',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
