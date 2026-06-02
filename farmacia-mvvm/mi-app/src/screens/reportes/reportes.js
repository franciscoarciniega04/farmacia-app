// src/screens/reportes/ReportesScreen.js

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReportesScreen({ route, navigation }) {
  const { usuario } = route.params || {};

  // Opciones de reportes disponibles
  const opcionesReportes = [
    {
      id: 'ventas',
      titulo: 'Reporte de Ventas',
      descripcion: 'Ventas por período, vendedor o producto',
      icono: 'receipt',
      color: '#3477eb',
      screen: 'ReporteVentas',
    },
    {
      id: 'compras',
      titulo: 'Reporte de Compras',
      descripcion: 'Compras por período y proveedor',
      icono: 'cart',
      color: '#28a745',
      screen: 'ReporteCompras',
    },
    {
      id: 'inventario',
      titulo: 'Reporte de Inventario',
      descripcion: 'Estado actual del inventario y alertas',
      icono: 'cube',
      color: '#ffc107',
      screen: 'ReporteInventario',
    },
    {
      id: 'productos-vendidos',
      titulo: 'Productos Más Vendidos',
      descripcion: 'Ranking de productos por ventas',
      icono: 'trending-up',
      color: '#dc3545',
      screen: 'ReporteProductosVendidos',
    },
    {
      id: 'usuarios',
      titulo: 'Actividad de Usuarios',
      descripcion: 'Ventas realizadas por usuario',
      icono: 'people',
      color: '#17a2b8',
      screen: 'ReporteUsuarios',
    },
  ];

  // Navegar al reporte específico
  const handleReportePress = (opcion) => {
    navigation.navigate(opcion.screen, {
      usuario: usuario,
      titulo: opcion.titulo,
    });
  };

  // Renderizar opción de reporte
  const renderOpcionReporte = (opcion) => (
    <TouchableOpacity
      key={opcion.id}
      style={[styles.reporteCard, { borderLeftColor: opcion.color }]}
      onPress={() => handleReportePress(opcion)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconoContainer, { backgroundColor: opcion.color }]}>
        <Ionicons name={opcion.icono} size={32} color="#fff" />
      </View>
      <View style={styles.reporteInfo}>
        <Text style={styles.reporteTitulo}>{opcion.titulo}</Text>
        <Text style={styles.reporteDescripcion}>{opcion.descripcion}</Text>
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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={26} color="#3477eb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reportes</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Contenido */}
        <ScrollView style={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#3477eb" />
            <Text style={styles.infoText}>
              Selecciona un tipo de reporte para visualizar los datos
            </Text>
          </View>

          {opcionesReportes.map((opcion) => renderOpcionReporte(opcion))}

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
  reporteCard: {
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
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reporteInfo: {
    flex: 1,
  },
  reporteTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2f4f7a',
    marginBottom: 4,
  },
  reporteDescripcion: {
    fontSize: 13,
    color: '#666',
  },
});
