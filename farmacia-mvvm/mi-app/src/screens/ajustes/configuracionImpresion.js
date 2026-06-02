// src/screens/ajustes/ConfiguracionImpresionScreen.js

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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/config';

export default function ConfiguracionImpresionScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    nombre_farmacia: '',
    direccion: '',
    telefono: '',
    rfc: '',
    incluir_logo_ticket: true,
    incluir_rfc_ticket: true,
    incluir_direccion_ticket: true,
    mensaje_pie_ticket: '¡Gracias por su compra!',
    tamano_etiqueta: '50x30mm',
    incluir_codigo_barras: true,
    incluir_precio_etiqueta: true,
    incluir_logo_reporte: true,
    orientacion_reporte: 'vertical',
    tamano_papel_reporte: 'carta',
  });

  // Estados para modales
  const [modalTamanoEtiquetaVisible, setModalTamanoEtiquetaVisible] = useState(false);
  const [modalOrientacionVisible, setModalOrientacionVisible] = useState(false);
  const [modalTamanoPapelVisible, setModalTamanoPapelVisible] = useState(false);

  // Opciones para los selectores
  const opcionesTamanoEtiqueta = [
    { value: '50x30mm', label: '50mm x 30mm' },
    { value: '60x40mm', label: '60mm x 40mm' },
    { value: '70x50mm', label: '70mm x 50mm' },
    { value: '80x60mm', label: '80mm x 60mm' },
  ];

  const opcionesOrientacion = [
    { value: 'vertical', label: 'Vertical' },
    { value: 'horizontal', label: 'Horizontal' },
  ];

  const opcionesTamanoPapel = [
    { value: 'carta', label: 'Carta' },
    { value: 'oficio', label: 'Oficio' },
    { value: 'a4', label: 'A4' },
  ];

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/configuracion/impresion`);
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
      const resp = await fetch(`${API_BASE_URL}/configuracion/impresion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!resp.ok) throw new Error('Error al guardar');
      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (campo, valor) => {
    setConfig((prev) => ({ ...prev, [campo]: valor }));
  };

  // Obtener texto de las opciones seleccionadas
  const getTextoTamanoEtiqueta = () => {
    const opcion = opcionesTamanoEtiqueta.find((op) => op.value === config.tamano_etiqueta);
    return opcion ? opcion.label : '50mm x 30mm';
  };

  const getTextoOrientacion = () => {
    const opcion = opcionesOrientacion.find((op) => op.value === config.orientacion_reporte);
    return opcion ? opcion.label : 'Vertical';
  };

  const getTextoTamanoPapel = () => {
    const opcion = opcionesTamanoPapel.find((op) => op.value === config.tamano_papel_reporte);
    return opcion ? opcion.label : 'Carta';
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
          <Text style={styles.headerTitle}>Config. Impresión</Text>
          <TouchableOpacity onPress={handleGuardar} style={styles.headerButton}>
            {loading ? (
              <ActivityIndicator size="small" color="#3477eb" />
            ) : (
              <Ionicons name="checkmark" size={28} color="#3477eb" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Información General */}
          <Text style={styles.sectionTitle}>Información General</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Negocio</Text>
            <TextInput
              style={styles.input}
              value={config.nombre_farmacia}
              onChangeText={(text) => handleChange('nombre_farmacia', text)}
              placeholder="Ej: Farmacia San José"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección</Text>
            <TextInput
              style={styles.input}
              value={config.direccion}
              onChangeText={(text) => handleChange('direccion', text)}
              placeholder="Calle, Número, Colonia"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={config.telefono}
              onChangeText={(text) => handleChange('telefono', text)}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>RFC</Text>
            <TextInput
              style={styles.input}
              value={config.rfc}
              onChangeText={(text) => handleChange('rfc', text)}
              placeholder="XAXX010101000"
              autoCapitalize="characters"
            />
          </View>

          {/* Configuración de Tickets */}
          <Text style={styles.sectionTitle}>Configuración de Tickets</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Incluir RFC en ticket</Text>
            <Switch
              value={config.incluir_rfc_ticket}
              onValueChange={(value) => handleChange('incluir_rfc_ticket', value)}
              trackColor={{ false: '#ccc', true: '#3477eb' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Incluir dirección en ticket</Text>
            <Switch
              value={config.incluir_direccion_ticket}
              onValueChange={(value) =>
                handleChange('incluir_direccion_ticket', value)
              }
              trackColor={{ false: '#ccc', true: '#3477eb' }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mensaje de pie de ticket</Text>
            <TextInput
              style={styles.input}
              value={config.mensaje_pie_ticket}
              onChangeText={(text) => handleChange('mensaje_pie_ticket', text)}
              placeholder="¡Gracias por su compra!"
            />
          </View>

          {/* Configuración de Etiquetas */}
          <Text style={styles.sectionTitle}>Configuración de Etiquetas</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tamaño de etiqueta</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setModalTamanoEtiquetaVisible(true)}
            >
              <Text style={styles.selectorText}>{getTextoTamanoEtiqueta()}</Text>
              <Ionicons name="chevron-forward" size={20} color="#3477eb" />
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Incluir código de barras</Text>
            <Switch
              value={config.incluir_codigo_barras}
              onValueChange={(value) =>
                handleChange('incluir_codigo_barras', value)
              }
              trackColor={{ false: '#ccc', true: '#3477eb' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Incluir precio en etiqueta</Text>
            <Switch
              value={config.incluir_precio_etiqueta}
              onValueChange={(value) =>
                handleChange('incluir_precio_etiqueta', value)
              }
              trackColor={{ false: '#ccc', true: '#3477eb' }}
            />
          </View>

          {/* Configuración de Reportes */}
          <Text style={styles.sectionTitle}>Configuración de Reportes</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Orientación</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setModalOrientacionVisible(true)}
            >
              <Text style={styles.selectorText}>{getTextoOrientacion()}</Text>
              <Ionicons name="chevron-forward" size={20} color="#3477eb" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tamaño de papel</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setModalTamanoPapelVisible(true)}
            >
              <Text style={styles.selectorText}>{getTextoTamanoPapel()}</Text>
              <Ionicons name="chevron-forward" size={20} color="#3477eb" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal Tamaño de Etiqueta */}
        <Modal
          visible={modalTamanoEtiquetaVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalTamanoEtiquetaVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setModalTamanoEtiquetaVisible(false)}
                  style={styles.modalBackButton}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Tamaño de Etiqueta</Text>
                <View style={{ width: 28 }} />
              </View>
              <View style={styles.modalContent}>
                {opcionesTamanoEtiqueta.map((opcion) => (
                  <TouchableOpacity
                    key={opcion.value}
                    style={styles.modalItem}
                    onPress={() => {
                      handleChange('tamano_etiqueta', opcion.value);
                      setModalTamanoEtiquetaVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{opcion.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Orientación */}
        <Modal
          visible={modalOrientacionVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalOrientacionVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setModalOrientacionVisible(false)}
                  style={styles.modalBackButton}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Orientación</Text>
                <View style={{ width: 28 }} />
              </View>
              <View style={styles.modalContent}>
                {opcionesOrientacion.map((opcion) => (
                  <TouchableOpacity
                    key={opcion.value}
                    style={styles.modalItem}
                    onPress={() => {
                      handleChange('orientacion_reporte', opcion.value);
                      setModalOrientacionVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{opcion.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Tamaño de Papel */}
        <Modal
          visible={modalTamanoPapelVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalTamanoPapelVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setModalTamanoPapelVisible(false)}
                  style={styles.modalBackButton}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Tamaño de Papel</Text>
                <View style={{ width: 28 }} />
              </View>
              <View style={styles.modalContent}>
                {opcionesTamanoPapel.map((opcion) => (
                  <TouchableOpacity
                    key={opcion.value}
                    style={styles.modalItem}
                    onPress={() => {
                      handleChange('tamano_papel_reporte', opcion.value);
                      setModalTamanoPapelVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{opcion.label}</Text>
                  </TouchableOpacity>
                ))}
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
    fontSize: 20,
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
  },
  // Estilos para modales
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
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
    maxHeight: 300,
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

