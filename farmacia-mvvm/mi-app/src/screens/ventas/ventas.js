// src/screens/ventas/VentasScreen.js

import React from 'react';
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import useVentasViewModel from '../../hooks/useVentasViewModel';

export default function VentasScreen({ route, navigation }) {
  const {
    mostrarFiltros,
    setMostrarFiltros,
    filtroUsuario,
    setFiltroUsuario,
    filtroFormaPago,
    setFiltroFormaPago,
    filtroFechaInicio,
    setFiltroFechaInicio,
    filtroFechaFin,
    setFiltroFechaFin,
    showDatePickerInicio,
    setShowDatePickerInicio,
    showDatePickerFin,
    setShowDatePickerFin,
    ventas,
    usuarios,
    formasPago,
    loading,
    refreshing,
    modalUsuarioVisible,
    setModalUsuarioVisible,
    modalFormaPagoVisible,
    setModalFormaPagoVisible,
    isOnline,
    dataSource,
    onRefresh,
    handleInsertarNueva,
    handleVerVenta,
    limpiarFiltros,
    hayFiltrosActivos,
    getTextoUsuarioSeleccionado,
    getTextoFormaPagoSeleccionada,
  } = useVentasViewModel({ route, navigation });

  // Renderizar item de venta
  const renderVentaItem = ({ item }) => (
    <TouchableOpacity
      style={styles.ventaCard}
      onPress={() => handleVerVenta(item)}
      activeOpacity={0.7}
    >
      <View style={styles.ventaHeader}>
        <View style={styles.ventaFolio}>
          <Text style={styles.folioLabel}>Folio:</Text>
          <Text style={styles.folioValue}>#{item.idVenta}</Text>
        </View>
        <Text style={styles.ventaTotal}>${(item.subtotal * 1.16).toFixed(2)}</Text>
      </View>

      <View style={styles.ventaInfo}>
        <View style={styles.ventaInfoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.ventaInfoText}>{item.nombreUsuario}</Text>
        </View>

        <View style={styles.ventaInfoRow}>
          <Ionicons name="card-outline" size={16} color="#666" />
          <Text style={styles.ventaInfoText}>{item.formaPago}</Text>
        </View>

        <View style={styles.ventaInfoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.ventaInfoText}>{item.fechaVenta}</Text>
        </View>
      </View>
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
            <Ionicons name="arrow-back" size={24} color="#2f4f7a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ventas</Text>
          <TouchableOpacity onPress={handleInsertarNueva} style={styles.headerButton}>
            <Ionicons name="add-circle" size={28} color="#3477eb" />
          </TouchableOpacity>
        </View>

        {/* Indicador de estado de conexión */}
        <View style={[styles.connectionBar, !isOnline && styles.connectionBarOffline]}>
          <Ionicons
            name={isOnline ? 'cloud-done' : 'cloud-offline'}
            size={16}
            color="#fff"
          />
          <Text style={styles.connectionText}>
            {isOnline ? 'Conectado' : 'Modo Offline'}
            {dataSource === 'cache' && ' (usando datos guardados)'}
          </Text>
        </View>

        {/* Botón de filtros */}
        <View style={styles.filterButtonContainer}>
          <TouchableOpacity
            onPress={() => setMostrarFiltros(!mostrarFiltros)}
            style={styles.filterToggleButton}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={18} color="#3477eb" />
            <Text style={styles.filterToggleText}>
              {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Text>
            {hayFiltrosActivos() && <View style={styles.filterActiveBadge} />}
          </TouchableOpacity>

          {hayFiltrosActivos() && (
            <TouchableOpacity
              style={styles.clearFiltersButtonSmall}
              onPress={limpiarFiltros}
            >
              <Ionicons name="close-circle" size={16} color="#fa3a3a" />
              <Text style={styles.clearFiltersTextSmall}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros colapsables */}
        {mostrarFiltros && (
          <View style={styles.filtrosContainer}>
            {/* Usuario */}
            <View style={styles.filtroRow}>
              <Text style={styles.filtroLabel}>Usuario:</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setModalUsuarioVisible(true)}
              >
                <Text
                  style={[
                    styles.selectorText,
                    !filtroUsuario && styles.selectorPlaceholder,
                  ]}
                >
                  {getTextoUsuarioSeleccionado()}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#3477eb" />
              </TouchableOpacity>
            </View>

            {/* Forma de Pago */}
            <View style={styles.filtroRow}>
              <Text style={styles.filtroLabel}>Forma de Pago:</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setModalFormaPagoVisible(true)}
              >
                <Text
                  style={[
                    styles.selectorText,
                    !filtroFormaPago && styles.selectorPlaceholder,
                  ]}
                >
                  {getTextoFormaPagoSeleccionada()}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#3477eb" />
              </TouchableOpacity>
            </View>

            {/* Fecha Inicio */}
            <View style={styles.filtroRow}>
              <Text style={styles.filtroLabel}>Fecha Inicio:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePickerInicio(true)}
              >
                <Text style={styles.dateText}>
                  {filtroFechaInicio
                    ? filtroFechaInicio.toLocaleDateString()
                    : 'Seleccionar'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#3477eb" />
              </TouchableOpacity>
            </View>

            {/* Fecha Fin */}
            <View style={styles.filtroRow}>
              <Text style={styles.filtroLabel}>Fecha Fin:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePickerFin(true)}
              >
                <Text style={styles.dateText}>
                  {filtroFechaFin ? filtroFechaFin.toLocaleDateString() : 'Seleccionar'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#3477eb" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lista de ventas */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3477eb" />
            <Text style={styles.loadingText}>Cargando ventas...</Text>
          </View>
        ) : ventas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay ventas registradas</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleInsertarNueva}
            >
              <Text style={styles.emptyButtonText}>Crear Primera Venta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={ventas}
            renderItem={renderVentaItem}
            keyExtractor={(item) => item.idVenta.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3477eb']}
              />
            }
          />
        )}

        {/* Date Pickers */}
        {showDatePickerInicio && (
          <DateTimePicker
            value={filtroFechaInicio || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePickerInicio(false);
              if (selectedDate) {
                setFiltroFechaInicio(selectedDate);
              }
            }}
          />
        )}

        {showDatePickerFin && (
          <DateTimePicker
            value={filtroFechaFin || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePickerFin(false);
              if (selectedDate) {
                setFiltroFechaFin(selectedDate);
              }
            }}
          />
        )}

        {/* Modal Usuario */}
        <Modal
          visible={modalUsuarioVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalUsuarioVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setModalUsuarioVisible(false)}
                  style={styles.modalBackButton}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Usuario</Text>
                <View style={{ width: 28 }} />
              </View>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFiltroUsuario('');
                    setModalUsuarioVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>Todos</Text>
                </TouchableOpacity>
                {usuarios.map((usr) => (
                  <TouchableOpacity
                    key={usr.idUsuario}
                    style={styles.modalItem}
                    onPress={() => {
                      setFiltroUsuario(usr.idUsuario);
                      setModalUsuarioVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{usr.username}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Forma de Pago */}
        <Modal
          visible={modalFormaPagoVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalFormaPagoVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setModalFormaPagoVisible(false)}
                  style={styles.modalBackButton}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Forma de Pago</Text>
                <View style={{ width: 28 }} />
              </View>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFiltroFormaPago('');
                    setModalFormaPagoVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>Todas</Text>
                </TouchableOpacity>
                {formasPago.map((fp) => (
                  <TouchableOpacity
                    key={fp.idFormaPago}
                    style={styles.modalItem}
                    onPress={() => {
                      setFiltroFormaPago(fp.idFormaPago);
                      setModalFormaPagoVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{fp.tipo}</Text>
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
    fontSize: 22,
    fontWeight: '700',
    color: '#2f4f7a',
  },
  // Barra de conexión
  connectionBar: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  connectionBarOffline: {
    backgroundColor: '#fa3a3a',
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  filterButtonContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    position: 'relative',
  },
  filterToggleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#3477eb',
  },
  filterActiveBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fa3a3a',
    position: 'absolute',
    top: 4,
    right: 4,
  },
  clearFiltersButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
  },
  clearFiltersTextSmall: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#fa3a3a',
  },
  filtrosContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  filtroRow: {
    marginBottom: 16,
  },
  filtroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#fff',
  },
  selectorText: {
    fontSize: 14,
    color: '#333',
  },
  selectorPlaceholder: {
    color: '#999',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
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
  ventaFolio: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folioLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 6,
  },
  folioValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3477eb',
  },
  ventaTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#28a745',
  },
  ventaInfo: {
    gap: 8,
  },
  ventaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ventaInfoText: {
    fontSize: 14,
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
    marginBottom: 24,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#3477eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    maxHeight: '80%',
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
    maxHeight: 500,
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
