// src/screens/ajustes/ExportarDatosScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '../../constants/config';

export default function ExportarDatosScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState('');

  const opcionesExportar = [
    {
      id: 'productos',
      titulo: 'Productos',
      descripcion: 'Exportar catálogo completo de productos',
      icono: 'cube',
      color: '#3477eb',
    },
    {
      id: 'ventas',
      titulo: 'Ventas',
      descripcion: 'Exportar historial de ventas',
      icono: 'receipt',
      color: '#28a745',
    },
    {
      id: 'compras',
      titulo: 'Compras',
      descripcion: 'Exportar historial de compras',
      icono: 'cart',
      color: '#ffc107',
    },
    {
      id: 'clientes',
      titulo: 'Clientes',
      descripcion: 'Exportar listado de clientes',
      icono: 'people',
      color: '#17a2b8',
    },
    {
      id: 'proveedores',
      titulo: 'Proveedores',
      descripcion: 'Exportar listado de proveedores',
      icono: 'business',
      color: '#dc3545',
    },
    {
      id: 'usuarios',
      titulo: 'Usuarios',
      descripcion: 'Exportar usuarios del sistema',
      icono: 'person',
      color: '#6f42c1',
    },
  ];

  const handleExportar = async (tipo) => {
    setLoading(true);
    setExportando(tipo);
    
    try {
      const resp = await fetch(`${API_BASE_URL}/exportar/${tipo}`, {
        method: 'GET',
      });

      if (!resp.ok) throw new Error(`Error al exportar ${tipo}`);

      const blob = await resp.blob();
      const fecha = new Date().toISOString().split('T')[0];
      const filename = `${tipo}_${fecha}.csv`;

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
        
        Alert.alert('Éxito', `Archivo ${filename} exportado correctamente`);
      };
      
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Error al exportar:', err);
      Alert.alert('Error', `No se pudo exportar ${tipo}`);
    } finally {
      setLoading(false);
      setExportando('');
    }
  };

  const renderOpcion = (opcion) => (
    <TouchableOpacity
      key={opcion.id}
      style={[styles.opcionCard, { borderLeftColor: opcion.color }]}
      onPress={() => handleExportar(opcion.id)}
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={[styles.iconoContainer, { backgroundColor: opcion.color }]}>
        <Ionicons name={opcion.icono} size={28} color="#fff" />
      </View>
      <View style={styles.opcionInfo}>
        <Text style={styles.opcionTitulo}>{opcion.titulo}</Text>
        <Text style={styles.opcionDescripcion}>{opcion.descripcion}</Text>
      </View>
      {loading && exportando === opcion.id ? (
        <ActivityIndicator size="small" color={opcion.color} />
      ) : (
        <Ionicons name="download" size={24} color={opcion.color} />
      )}
    </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Exportar Datos</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#3477eb" />
            <Text style={styles.infoText}>
              Los datos se exportarán en formato CSV
            </Text>
          </View>

          {opcionesExportar.map((opcion) => renderOpcion(opcion))}

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
