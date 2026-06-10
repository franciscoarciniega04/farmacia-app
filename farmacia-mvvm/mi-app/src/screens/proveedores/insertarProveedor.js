import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import proveedorRepository from '../../repositories/proveedorRepository';
import DatabaseService from '../../services/dataService';

export default function InsertarProveedorScreen({ route, navigation }) {
  const { proveedor, onProveedorGuardado } = route.params || {};
  const esEdicion = Boolean(proveedor?.idProveedor);

  const [nombre, setNombre] = useState('');
  const [RFC, setRFC] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [estado, setEstado] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [estatus, setEstatus] = useState(1);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (proveedor) {
      setNombre(proveedor.nombre || '');
      setRFC(proveedor.RFC || proveedor.rfc || '');
      setDireccion(proveedor.direccion || '');
      setCiudad(proveedor.ciudad || '');
      setEstado(proveedor.estado || '');
      setTelefono(proveedor.telefono || '');
      setCorreo(proveedor.correo || '');
      setEstatus(Number(proveedor.estatus ?? 1));
    }
  }, [proveedor]);

  const validarFormulario = () => {
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'El nombre del proveedor es obligatorio.');
      return false;
    }

    if (!RFC.trim()) {
      Alert.alert('Campo requerido', 'El RFC del proveedor es obligatorio.');
      return false;
    }

    return true;
  };

  const actualizarCacheLocal = async (proveedorGuardado) => {
    try {
      const proveedoresCache = await DatabaseService.getCachedProveedores();

      let nuevosProveedores = [];

      if (esEdicion) {
        nuevosProveedores = proveedoresCache.map((item) =>
          String(item.idProveedor) === String(proveedor.idProveedor)
            ? proveedorGuardado
            : item
        );
      } else {
        nuevosProveedores = [
          proveedorGuardado,
          ...proveedoresCache.filter(
            (item) =>
              String(item.idProveedor) !== String(proveedorGuardado.idProveedor)
          ),
        ];
      }

      await DatabaseService.cacheProveedores(nuevosProveedores);
    } catch (error) {
      console.error('Error actualizando caché de proveedores:', error);
    }
  };

  const guardarOffline = async (proveedorData) => {
    const localId = esEdicion
      ? proveedor.idProveedor
      : `local_proveedor_${Date.now()}`;

    const proveedorLocal = {
      ...proveedorData,
      idProveedor: localId,
      pendienteSync: true,
      estadoSync: 'pendiente',
    };

    await DatabaseService.addToSyncQueue({
      type: esEdicion ? 'proveedor:update' : 'proveedor:create',
      endpoint: esEdicion
        ? `/proveedores/${proveedor.idProveedor}`
        : '/proveedores/',
      method: esEdicion ? 'PUT' : 'POST',
      data: proveedorData,
      localId,
    });

    await actualizarCacheLocal(proveedorLocal);

    Alert.alert(
      'Guardado offline',
      'El proveedor se guardó localmente y se sincronizará cuando vuelva internet.',
      [
        {
          text: 'OK',
          onPress: () => {
            onProveedorGuardado?.();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    const proveedorData = {
      nombre: nombre.trim(),
      RFC: RFC.trim().toUpperCase(),
      direccion: direccion.trim() || null,
      ciudad: ciudad.trim() || null,
      estado: estado.trim() || null,
      telefono: telefono.trim() || null,
      correo: correo.trim() || null,
      estatus,
    };

    setGuardando(true);

    try {
      const online = await DatabaseService.checkConnection();

      if (!online) {
        await guardarOffline(proveedorData);
        return;
      }

      let proveedorGuardado;

      if (esEdicion) {
        proveedorGuardado = await proveedorRepository.update(
          proveedor.idProveedor,
          proveedorData
        );
      } else {
        proveedorGuardado = await proveedorRepository.create(proveedorData);
      }

      await actualizarCacheLocal(proveedorGuardado);

      Alert.alert(
        esEdicion ? 'Proveedor actualizado' : 'Proveedor creado',
        esEdicion
          ? 'El proveedor se actualizó correctamente.'
          : 'El proveedor se creó correctamente.',
        [
          {
            text: 'OK',
            onPress: () => {
              onProveedorGuardado?.();
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error guardando proveedor:', error);

      const mensaje =
        error?.message ||
        error?.response?.data?.detail ||
        'No se pudo guardar el proveedor.';

      Alert.alert('Error', mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!esEdicion) return;

    Alert.alert(
      'Eliminar proveedor',
      '¿Deseas dar de baja este proveedor?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setGuardando(true);

              const online = await DatabaseService.checkConnection();

              if (!online) {
                Alert.alert(
                  'Sin conexión',
                  'No se puede eliminar un proveedor sin conexión.'
                );
                return;
              }

              await proveedorRepository.remove(proveedor.idProveedor);

              Alert.alert(
                'Proveedor eliminado',
                'El proveedor fue dado de baja correctamente.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      onProveedorGuardado?.();
                      navigation.goBack();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error eliminando proveedor:', error);
              Alert.alert('Error', 'No se pudo eliminar el proveedor.');
            } finally {
              setGuardando(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={26} color="#3477eb" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {esEdicion ? 'Editar proveedor' : 'Nuevo proveedor'}
        </Text>

        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Datos del proveedor</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre del proveedor"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>RFC *</Text>
          <TextInput
            style={styles.input}
            value={RFC}
            onChangeText={setRFC}
            placeholder="RFC"
            placeholderTextColor="#999"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            placeholder="Teléfono"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo</Text>
          <TextInput
            style={styles.input}
            value={correo}
            onChangeText={setCorreo}
            placeholder="correo@ejemplo.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Dirección"
            placeholderTextColor="#999"
            multiline
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>Ciudad</Text>
            <TextInput
              style={styles.input}
              value={ciudad}
              onChangeText={setCiudad}
              placeholder="Ciudad"
              placeholderTextColor="#999"
            />
          </View>

          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>Estado</Text>
            <TextInput
              style={styles.input}
              value={estado}
              onChangeText={setEstado}
              placeholder="Estado"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.estatusContainer}
          onPress={() => setEstatus(estatus === 1 ? 0 : 1)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={estatus === 1 ? 'checkbox' : 'square-outline'}
            size={24}
            color="#3477eb"
          />
          <Text style={styles.estatusText}>Proveedor activo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, guardando && styles.disabledButton]}
          onPress={handleGuardar}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {esEdicion ? 'Guardar cambios' : 'Crear proveedor'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {esEdicion && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleEliminar}
            disabled={guardando}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Dar de baja proveedor</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
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
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#2f4f7a',
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f7ff',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2f4f7a',
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d8e3f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#222',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  estatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#d8e3f0',
  },
  estatusText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#3477eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.7,
  },
});