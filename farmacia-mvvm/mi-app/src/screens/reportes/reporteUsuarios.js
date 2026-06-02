// src/screens/reportes/ReporteUsuariosScreen.js

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

export default function ReporteUsuariosScreen({ route, navigation }) {
  const { titulo } = route.params || {};

  // Estados
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [fechaFin, setFechaFin] = useState(new Date());
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFin, setShowDatePickerFin] = useState(false);

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

      // Obtener ventas del período
      const respVentas = await fetch(
        `${API_BASE_URL}/ventas/?fechaInicio=${inicio}&fechaFin=${fin}`
      );
      if (!respVentas.ok) throw new Error('Error al cargar ventas');
      const ventas = await respVentas.json();

      // Obtener usuarios
      const respUsuarios = await fetch(`${API_BASE_URL}/usuarios/?soloActivos=true`);
      if (!respUsuarios.ok) throw new Error('Error al cargar usuarios');
      const usuariosData = await respUsuarios.json();

      // Procesar datos para agrupar ventas por usuario
      const usuariosMap = {};

      usuariosData.forEach((user) => {
        usuariosMap[user.idUsuario] = {
          idUsuario: user.idUsuario,
          nombre: `${user.nombre} ${user.apellido}`,
          username: user.username,
          nombreRol: user.nombreRol,
          ventasRealizadas: 0,
          totalVendido: 0,
        };
      });

      // Contar ventas por usuario
      ventas.forEach((venta) => {
        if (venta.idUsuario && usuariosMap[venta.idUsuario]) {
          usuariosMap[venta.idUsuario].ventasRealizadas += 1;
          usuariosMap[venta.idUsuario].totalVendido += venta.subtotal * 1.16;
        }
      });

      // Convertir a array y ordenar por total vendido
      const usuariosArray = Object.values(usuariosMap)
        .filter((u) => u.ventasRealizadas > 0)
        .sort((a, b) => b.totalVendido - a.totalVendido);

      setUsuarios(usuariosArray);
    } catch (err) {
      console.error('Error al cargar reporte:', err);
      Alert.alert('Error', 'No se pudo cargar el reporte de usuarios');
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

  // Renderizar item de usuario
  const renderUsuarioItem = ({ item }) => (
    <View style={styles.usuarioCard}>
      <View style={styles.usuarioHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={48} color="#17a2b8" />
        </View>
        <View style={styles.usuarioInfo}>
          <Text style={styles.usuarioNombre}>{item.nombre}</Text>
          <Text style={styles.usuarioUsername}>@{item.username}</Text>
          <View style={styles.rolContainer}>
            <Ionicons name="shield-checkmark" size={12} color="#666" />
            <Text style={styles.rolText}>{item.nombreRol}</Text>
          </View>
        </View>
      </View>
      <View style={styles.estadisticasContainer}>
        <View style={styles.estadisticaItem}>
          <Ionicons name="receipt" size={16} color="#17a2b8" />
          <Text style={styles.estadisticaLabel}>Ventas</Text>
          <Text style={styles.estadisticaValue}>{item.ventasRealizadas}</Text>
        </View>
        <View style={styles.estadisticaDivider} />
        <View style={styles.estadisticaItem}>
          <Ionicons name="cash" size={16} color="#28a745" />
          <Text style={styles.estadisticaLabel}>Total</Text>
          <Text style={[styles.estadisticaValue, { color: '#28a745' }]}>
            ${item.totalVendido.toFixed(2)}
          </Text>
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
              <Ionicons name="calendar" size={18} color="#17a2b8" />
              <Text style={[styles.fechaText, { color: '#17a2b8' }]}>
                {fechaInicio.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <Text style={styles.fechaSeparator}>hasta</Text>
            <TouchableOpacity
              style={styles.fechaButton}
              onPress={() => setShowDatePickerFin(true)}
            >
              <Ionicons name="calendar" size={18} color="#17a2b8" />
              <Text style={[styles.fechaText, { color: '#17a2b8' }]}>
                {fechaFin.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumen */}
        <View style={styles.resumenContainer}>
          <View style={[styles.resumenCard, { backgroundColor: '#e8f8fa' }]}>
            <Text style={styles.resumenLabel}>Usuarios Activos</Text>
            <Text style={[styles.resumenValue, { color: '#17a2b8' }]}>
              {usuarios.length}
            </Text>
          </View>
          <View style={[styles.resumenCard, { backgroundColor: '#e8f8fa' }]}>
            <Text style={styles.resumenLabel}>Total Ventas</Text>
            <Text style={[styles.resumenValue, { color: '#17a2b8' }]}>
              {usuarios.reduce((sum, u) => sum + u.ventasRealizadas, 0)}
            </Text>
          </View>
        </View>

        {/* Lista de usuarios */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#17a2b8" />
            <Text style={styles.loadingText}>Cargando reporte...</Text>
          </View>
        ) : usuarios.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              No hay actividad de usuarios en el período seleccionado
            </Text>
          </View>
        ) : (
          <FlatList
            data={usuarios}
            renderItem={renderUsuarioItem}
            keyExtractor={(item) => item.idUsuario.toString()}
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
    backgroundColor: '#e8f8fa',
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
  usuarioCard: {
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
  usuarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  avatarContainer: {},
  usuarioInfo: {
    flex: 1,
  },
  usuarioNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2f4f7a',
    marginBottom: 2,
  },
  usuarioUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rolContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rolText: {
    fontSize: 12,
    color: '#666',
  },
  estadisticasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  estadisticaItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  estadisticaDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  estadisticaLabel: {
    fontSize: 12,
    color: '#666',
  },
  estadisticaValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17a2b8',
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
