// src/screens/reportes/ReporteVentasScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_BASE_URL } from '../../constants/config';

export default function ReporteVentasScreen({ route, navigation }) {
  const { titulo } = route.params || {};

  // Estados
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [fechaFin, setFechaFin] = useState(new Date());
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFin, setShowDatePickerFin] = useState(false);
  const [totalGeneral, setTotalGeneral] = useState(0);

  // Cargar datos al montar y cuando cambien las fechas
  useEffect(() => {
    cargarReporte();
  }, [fechaInicio, fechaFin]);

  // Función para cargar reporte
  const cargarReporte = async () => {
    setLoading(true);
    try {
      const inicio = fechaInicio.toISOString().split('T')[0];
      const fin = fechaFin.toISOString().split('T')[0];
      const resp = await fetch(
        `${API_BASE_URL}/ventas/?fechaInicio=${inicio}&fechaFin=${fin}`
      );
      if (!resp.ok) throw new Error('Error al cargar reporte');
      const data = await resp.json();
      setVentas(data);

      // Calcular total
      const total = data.reduce((sum, v) => sum + v.subtotal * 1.16, 0);
      setTotalGeneral(total);
    } catch (err) {
      console.error('Error al cargar reporte:', err);
      Alert.alert('Error', 'No se pudo cargar el reporte de ventas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para refrescar
  const onRefresh = () => {
    setRefreshing(true);
    cargarReporte();
  };

  // Renderizar item de venta
  const renderVentaItem = ({ item }) => (
    <View style={styles.ventaCard}>
      <View style={styles.ventaHeader}>
        <View style={styles.folioContainer}>
          <Text style={styles.folioLabel}>Folio:</Text>
          <Text style={styles.folioValue}>#{item.idVenta}</Text>
        </View>
        <Text style={styles.totalValue}>
          ${(item.subtotal * 1.16).toFixed(2)}
        </Text>
      </View>
      <View style={styles.ventaDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{item.fechaVenta}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{item.nombreCliente}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="card-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{item.formaPago}</Text>
        </View>
      </View>
    </View>
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
          <Text style={styles.headerTitle}>{titulo}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Filtros de fecha */}
        <View style={styles.filtrosContainer}>
          <Text style={styles.filtrosTitle}>Rango de Fechas</Text>
          <View style={styles.fechasRow}>
            <TouchableOpacity
              style={styles.fechaButton}
              onPress={() => setShowDatePickerInicio(true)}
            >
              <Ionicons name="calendar" size={18} color="#3477eb" />
              <Text style={styles.fechaText}>
                {fechaInicio.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <Text style={styles.fechaSeparator}>hasta</Text>
            <TouchableOpacity
              style={styles.fechaButton}
              onPress={() => setShowDatePickerFin(true)}
            >
              <Ionicons name="calendar" size={18} color="#3477eb" />
              <Text style={styles.fechaText}>
                {fechaFin.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumen */}
        <View style={styles.resumenContainer}>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenLabel}>Total Ventas</Text>
            <Text style={styles.resumenValue}>{ventas.length}</Text>
          </View>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenLabel}>Total Ingresos</Text>
            <Text style={styles.resumenValue}>
              ${totalGeneral.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Lista de ventas */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3477eb" />
            <Text style={styles.loadingText}>Cargando reporte...</Text>
          </View>
        ) : ventas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              No hay ventas en el período seleccionado
            </Text>
          </View>
        ) : (
          <FlatList
            data={ventas}
            renderItem={renderVentaItem}
            keyExtractor={(item) => item.idVenta.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}

        {/* Date Pickers */}
        {showDatePickerInicio && (
          <DateTimePicker
            value={fechaInicio}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePickerInicio(false);
              if (selectedDate) {
                setFechaInicio(selectedDate);
              }
            }}
          />
        )}

        {showDatePickerFin && (
          <DateTimePicker
            value={fechaFin}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePickerFin(false);
              if (selectedDate) {
                setFechaFin(selectedDate);
              }
            }}
          />
        )}
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
  filtrosContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  filtrosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  fechasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fechaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  fechaText: {
    fontSize: 14,
    color: '#3477eb',
    fontWeight: '600',
  },
  fechaSeparator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  resumenContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
    gap: 12,
  },
  resumenCard: {
    flex: 1,
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resumenLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resumenValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3477eb',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  ventaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ventaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  folioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folioLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 6,
  },
  folioValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3477eb',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28a745',
  },
  ventaDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
