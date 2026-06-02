// src/screens/reportes/ReporteComprasScreen.js

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

export default function ReporteComprasScreen({ route, navigation }) {
  const { titulo } = route.params || {};

  // Estados
  const [compras, setCompras] = useState([]);
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
        `${API_BASE_URL}/compras/?fechaInicio=${inicio}&fechaFin=${fin}`
      );
      if (!resp.ok) throw new Error('Error al cargar reporte');
      const data = await resp.json();
      setCompras(data);

      // Calcular total
      const total = data.reduce((sum, c) => sum + c.subtotal * 1.16, 0);
      setTotalGeneral(total);
    } catch (err) {
      console.error('Error al cargar reporte:', err);
      Alert.alert('Error', 'No se pudo cargar el reporte de compras');
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

  // Obtener color según estatus
  const getColorEstatus = (estatus) => {
    switch (estatus) {
      case 'Realizada':
        return '#28a745';
      case 'Pendiente':
        return '#FDC13B';
      case 'Cancelada':
        return '#fa3a3a';
      default:
        return '#6c757d';
    }
  };

  // Renderizar item de compra
  const renderCompraItem = ({ item }) => (
    <View style={styles.compraCard}>
      <View style={styles.compraHeader}>
        <View style={styles.folioContainer}>
          <Text style={styles.folioLabel}>Folio:</Text>
          <Text style={styles.folioValue}>#{item.idCompra}</Text>
        </View>
        <Text style={styles.totalValue}>
          ${(item.subtotal * 1.16).toFixed(2)}
        </Text>
      </View>
      <View style={styles.compraDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{item.fechaCompra}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{item.nombreProveedor}</Text>
        </View>
        <View style={styles.detailRow}>
          <View
            style={[
              styles.estatusBadge,
              { backgroundColor: getColorEstatus(item.estatus) },
            ]}
          >
            <Text style={styles.estatusText}>{item.estatus}</Text>
          </View>
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
              <Ionicons name="calendar" size={18} color="#28a745" />
              <Text style={[styles.fechaText, { color: '#28a745' }]}>
                {fechaInicio.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <Text style={styles.fechaSeparator}>hasta</Text>
            <TouchableOpacity
              style={styles.fechaButton}
              onPress={() => setShowDatePickerFin(true)}
            >
              <Ionicons name="calendar" size={18} color="#28a745" />
              <Text style={[styles.fechaText, { color: '#28a745' }]}>
                {fechaFin.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumen */}
        <View style={styles.resumenContainer}>
          <View style={[styles.resumenCard, { backgroundColor: '#e8f5e9' }]}>
            <Text style={styles.resumenLabel}>Total Compras</Text>
            <Text style={[styles.resumenValue, { color: '#28a745' }]}>
              {compras.length}
            </Text>
          </View>
          <View style={[styles.resumenCard, { backgroundColor: '#e8f5e9' }]}>
            <Text style={styles.resumenLabel}>Total Gastado</Text>
            <Text style={[styles.resumenValue, { color: '#28a745' }]}>
              ${totalGeneral.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Lista de compras */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#28a745" />
            <Text style={styles.loadingText}>Cargando reporte...</Text>
          </View>
        ) : compras.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              No hay compras en el período seleccionado
            </Text>
          </View>
        ) : (
          <FlatList
            data={compras}
            renderItem={renderCompraItem}
            keyExtractor={(item) => item.idCompra.toString()}
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
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  fechaText: {
    fontSize: 14,
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
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  compraCard: {
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
  compraHeader: {
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
    color: '#28a745',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28a745',
  },
  compraDetails: {
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
  estatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
