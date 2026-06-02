// src/screens/ajustes/ConfiguracionSeguridadScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/config';

export default function ConfiguracionSeguridadScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    longitud_minima_password: 8,
    requerir_mayusculas: true,
    requerir_minusculas: true,
    requerir_numeros: true,
    requerir_caracteres_especiales: false,
    dias_expiracion_password: 90,
    tiempo_sesion_minutos: 480,
    cerrar_sesion_inactividad: true,
    minutos_inactividad: 30,
    permitir_sesiones_multiples: false,
    intentos_login_permitidos: 5,
    minutos_bloqueo_cuenta: 30,
    requerir_cambio_password_primer_login: true,
    registrar_acciones_usuarios: true,
    registrar_cambios_datos: true,
    dias_retencion_logs: 90,
  });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/seguridad/configuracion`);
      if (resp.ok) {
        const data = await resp.json();
        setConfig(data);
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err);
    }
  };

  const handleGuardar = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/seguridad/configuracion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!resp.ok) throw new Error('Error al guardar');

      Alert.alert('Éxito', 'Configuración de seguridad guardada correctamente');
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (campo, valor) => {
    setConfig((prev) => ({ ...prev, [campo]: valor }));
  };

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
          <Text style={styles.headerTitle}>Seguridad</Text>
          <TouchableOpacity
            onPress={handleGuardar}
            style={styles.headerButton}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#3477eb" />
            ) : (
              <Ionicons name="checkmark-circle" size={32} color="#3477eb" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Políticas de Contraseñas */}
          <Text style={styles.sectionTitle}>Políticas de Contraseñas</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Longitud mínima de contraseña</Text>
            <TextInput
              style={styles.input}
              value={config.longitud_minima_password.toString()}
              onChangeText={(text) =>
                handleChange('longitud_minima_password', parseInt(text) || 8)
              }
              keyboardType="numeric"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Requerir mayúsculas</Text>
            <Switch
              value={config.requerir_mayusculas}
              onValueChange={(value) => handleChange('requerir_mayusculas', value)}
              trackColor={{ false: '#ccc', true: '#e83e8c' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Requerir minúsculas</Text>
            <Switch
              value={config.requerir_minusculas}
              onValueChange={(value) => handleChange('requerir_minusculas', value)}
              trackColor={{ false: '#ccc', true: '#e83e8c' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Requerir números</Text>
            <Switch
              value={config.requerir_numeros}
              onValueChange={(value) => handleChange('requerir_numeros', value)}
              trackColor={{ false: '#ccc', true: '#e83e8c' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Requerir caracteres especiales</Text>
            <Switch
              value={config.requerir_caracteres_especiales}
              onValueChange={(value) =>
                handleChange('requerir_caracteres_especiales', value)
              }
              trackColor={{ false: '#ccc', true: '#e83e8c' }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Días para expiración de contraseña</Text>
            <TextInput
              style={styles.input}
              value={config.dias_expiracion_password.toString()}
              onChangeText={(text) =>
                handleChange('dias_expiracion_password', parseInt(text) || 90)
              }
              keyboardType="numeric"
            />
          </View>

          {/* Gestión de Sesiones */}
          <Text style={styles.sectionTitle}>Gestión de Sesiones</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiempo máximo de sesión (minutos)</Text>
            <TextInput
              style={styles.input}
              value={config.tiempo_sesion_minutos.toString()}
              onChangeText={(text) =>
                handleChange('tiempo_sesion_minutos', parseInt(text) || 480)
              }
              keyboardType="numeric"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Cerrar por inactividad</Text>
            <Switch
              value={config.cerrar_sesion_inactividad}
              onValueChange={(value) =>
                handleChange('cerrar_sesion_inactividad', value)
              }
              trackColor={{ false: '#ccc', true: '#e83e8c' }}
            />
          </View>

          {config.cerrar_sesion_inactividad && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Minutos de inactividad</Text>
              <TextInput
                style={styles.input}
                value={config.minutos_inactividad.toString()}
                onChangeText={(text) =>
                  handleChange('minutos_inactividad', parseInt(text) || 30)
                }
                keyboardType="numeric"
              />
            </View>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Permitir sesiones múltiples</Text>
            <Switch
              value={config.permitir_sesiones_multiples}
              onValueChange={(value) =>
                handleChange('permitir_sesiones_multiples', value)
              }
              trackColor={{ false: '#ccc', true: '#e83e8c' }}
            />
          </View>

          {/* Control de Accesos */}
          <Text style={styles.sectionTitle}>Control de Accesos</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Intentos de login permitidos</Text>
            <TextInput
              style={styles.input}
              value={config.intentos_login_permitidos.toString()}
              onChangeText={(text) =>
                handleChange('intentos_login_permitidos', parseInt(text) || 5)
              }
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Minutos de bloqueo de cuenta</Text>
            <TextInput
              style={styles.input}
              value={config.minutos_bloqueo_cuenta.toString()}
              onChangeText={(text) =>
                handleChange('minutos_bloqueo_cuenta', parseInt(text) || 30)
              }
              keyboardType="numeric"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              Cambiar password en primer login
            </Text>
            <Switch
              value={config.requerir_cambio_password_primer_login}
              onValueChange={(value) =>
                handleChange('requerir_cambio_password_primer_login', value)
              }
              trackColor={{ false: '#ccc', true: '#e83e8c' }}
            />
          </View>

          {/* Auditoría */}
          <Text style={styles.sectionTitle}>Auditoría y Registros</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Registrar acciones de usuarios</Text>
            <Switch
              value={config.registrar_acciones_usuarios}
              onValueChange={(value) =>
                handleChange('registrar_acciones_usuarios', value)
              }
              trackColor={{ false: '#ccc', true: '#e83e8c' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Registrar cambios en datos</Text>
            <Switch
              value={config.registrar_cambios_datos}
              onValueChange={(value) =>
                handleChange('registrar_cambios_datos', value)
              }
              trackColor={{ false: '#ccc', true: '#e83e8c' }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Días de retención de logs</Text>
            <TextInput
              style={styles.input}
              value={config.dias_retencion_logs.toString()}
              onChangeText={(text) =>
                handleChange('dias_retencion_logs', parseInt(text) || 90)
              }
              keyboardType="numeric"
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2f4f7a',
    marginTop: 8,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
});
