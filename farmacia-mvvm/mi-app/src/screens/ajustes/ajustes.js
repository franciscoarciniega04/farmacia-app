// src/screens/ajustes/AjustesScreen.js

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '../../constants/config';

export default function AjustesScreen({ route, navigation }) {
  const { usuario } = route.params || {};

  // Opciones de ajustes
  const opcionesAjustes = [
    {
      id: 'backup',
      titulo: 'Respaldo de Base de Datos',
      descripcion: 'Crear copia de seguridad de todos los datos',
      icono: 'server',
      color: '#3477eb',
      accion: () => handleBackup(),
    },
    {
      id: 'exportar',
      titulo: 'Exportar Datos',
      descripcion: 'Exportar datos a archivo CSV',
      icono: 'download',
      color: '#28a745',
      accion: () => navigation.navigate('ExportarDatos', { usuario }),
    },
    {
      id: 'clientes',
      titulo: 'Gestión de Clientes',
      descripcion: 'Administrar clientes del sistema',
      icono: 'people',
      color: '#17a2b8',
      accion: () => navigation.navigate('GestionClientes', { usuario }),
    },
    {
      id: 'roles',
      titulo: 'Gestión de Roles',
      descripcion: 'Administrar roles y permisos',
      icono: 'shield-checkmark',
      color: '#ffc107',
      accion: () => navigation.navigate('GestionRoles', { usuario }),
    },
    {
      id: 'categorias',
      titulo: 'Gestión de Categorías',
      descripcion: 'Administrar categorías de productos',
      icono: 'pricetags',
      color: '#dc3545',
      accion: () => navigation.navigate('GestionCategorias', { usuario }),
    },
    {
      id: 'ajuste-inventario',
      titulo: 'Ajuste de Inventario',
      descripcion: 'Ajuste manual de stock de productos',
      icono: 'calculator',
      color: '#6f42c1',
      accion: () => navigation.navigate('AjusteInventario', { usuario }),
    },
    {
      id: 'impresion',
      titulo: 'Configuración de Impresión',
      descripcion: 'Configurar tickets, etiquetas y reportes',
      icono: 'print',
      color: '#fd7e14',
      accion: () => navigation.navigate('ConfiguracionImpresion', { usuario }),
    },
    {
      id: 'seguridad',
      titulo: 'Seguridad y Accesos',
      descripcion: 'Configurar políticas de seguridad',
      icono: 'lock-closed',
      color: '#e83e8c',
      accion: () => navigation.navigate('ConfiguracionSeguridad', { usuario }),
    },
    {
      id: 'prueba-cloud',
      titulo: 'Prueba en la Nube',
      descripcion: 'Guardar y leer datos reales desde Firebase Firestore',
      icono: 'cloud-done',
      color: '#3477eb',
      accion: () => navigation.navigate('PruebaCloud', { usuario }),
    },
  ];

  // Función para crear backup
  const handleBackup = async () => {
    Alert.alert(
      'Crear Respaldo',
      '¿Deseas crear una copia de seguridad completa de la base de datos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear Backup',
          onPress: async () => {
            try {
              const resp = await fetch(`${API_BASE_URL}/backup/crear`, {
                method: 'POST',
              });

              if (!resp.ok) throw new Error('Error al crear backup');

              const blob = await resp.blob();
              const fecha = new Date().toISOString().split('T')[0];
              const filename = `backup_${fecha}.sql`;

              // Guardar archivo
              const fileUri = FileSystem.documentDirectory + filename;
              const reader = new FileReader();
              reader.onloadend = async () => {
                const base64 = reader.result.split(',')[1];
                await FileSystem.writeAsStringAsync(fileUri, base64, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                
                // Compartir archivo
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(fileUri);
                }
                
                Alert.alert('Éxito', 'Backup creado correctamente');
              };
              reader.readAsDataURL(blob);
            } catch (err) {
              Alert.alert('Error', 'No se pudo crear el backup');
            }
          },
        },
      ]
    );
  };

  // Renderizar opción
  const renderOpcion = (opcion) => (
    <TouchableOpacity
      key={opcion.id}
      style={[styles.opcionCard, { borderLeftColor: opcion.color }]}
      onPress={opcion.accion}
      activeOpacity={0.7}
    >
      <View style={[styles.iconoContainer, { backgroundColor: opcion.color }]}>
        <Ionicons name={opcion.icono} size={28} color="#fff" />
      </View>
      <View style={styles.opcionInfo}>
        <Text style={styles.opcionTitulo}>{opcion.titulo}</Text>
        <Text style={styles.opcionDescripcion}>{opcion.descripcion}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

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
            <Ionicons name="arrow-back" size={26} color="#3477eb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajustes</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Contenido */}
        <ScrollView style={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="settings" size={24} color="#3477eb" />
            <Text style={styles.infoText}>
              Configuración y administración del sistema
            </Text>
          </View>

          {opcionesAjustes.map((opcion) => renderOpcion(opcion))}

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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#3477eb',
    fontWeight: '600',
  },
  opcionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  iconoContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  opcionInfo: {
    flex: 1,
  },
  opcionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2f4f7a',
    marginBottom: 4,
  },
  opcionDescripcion: {
    fontSize: 13,
    color: '#666',
  },
});
