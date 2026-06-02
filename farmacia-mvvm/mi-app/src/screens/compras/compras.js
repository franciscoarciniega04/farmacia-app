// src/screens/compras/ComprasScreen.js

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
import useComprasViewModel from '../../hooks/useComprasViewModel';

export default function ComprasScreen({ route, navigation }) {
  const {
    mostrarFiltros,
    setMostrarFiltros,
    filtroProveedor,
    setFiltroProveedor,
    filtroFechaInicio,
    setFiltroFechaInicio,
    filtroFechaFin,
    setFiltroFechaFin,
    filtroEstatus,
    setFiltroEstatus,
    showDatePickerInicio,
    setShowDatePickerInicio,
    showDatePickerFin,
    setShowDatePickerFin,
    compras,
    proveedores,
    loading,
    refreshing,
    modalProveedorVisible,
    setModalProveedorVisible,
    modalEstatusVisible,
    setModalEstatusVisible,
    isOnline,
    dataSource,
    opcionesEstatus,
    onRefresh,
    handleInsertarNueva,
    handleVerCompra,
    limpiarFiltros,
    hayFiltrosActivos,
    getTextoProveedorSeleccionado,
    getTextoEstatusSeleccionado,
    getColorEstatus,
  } = useComprasViewModel({ route, navigation });

  // Renderizar item de compra
  const renderCompraItem = ({ item }) => (
    <TouchableOpacity
      style={styles.compraCard}
      onPress={() => handleVerCompra(item)}
      activeOpacity={0.7}
    >
      <View style={styles.compraHeader}>
        <View style={styles.compraFolio}>
          <Text style={styles.folioLabel}>Folio:</Text>
          <Text style={styles.folioValue}>#{item.idCompra}</Text>
        </View>
        <Text style={styles.compraTotal}>${(item.subtotal * 1.16).toFixed(2)}</Text>
      </View>

      <View style={styles.compraInfo}>
        <View style={styles.compraInfoRow}>
          <Ionicons name="business-outline" size={16} color="#666" />
          <Text style={styles.compraInfoText}>{item.nombreProveedor}</Text>
        </View>

        <View style={styles.compraInfoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.compraInfoText}>{item.fechaCompra}</Text>
        </View>

        <View style={styles.compraInfoRow}>
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
          <Text style={styles.headerTitle}>Compras</Text>
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
            {/* Filtro Proveedor */}
            <View style={styles.filtroRow}>
              <Text style={styles.filtroLabel}>Proveedor:</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setModalProveedorVisible(true)}
              >
                <Text style={styles.selectorText}>
                  {getTextoProveedorSeleccionado()}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#3477eb" />
              </TouchableOpacity>
            </View>

            {/* Filtro Estatus */}
            <View style={styles.filtroRow}>
              <Text style={styles.filtroLabel}>Estatus:</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setModalEstatusVisible(true)}
              >
                <Text style={styles.selectorText}>
                  {getTextoEstatusSeleccionado()}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#3477eb" />
              </TouchableOpacity>
            </View>

            {/* Filtro Fecha Inicio */}
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

            {/* Filtro Fecha Fin */}
            <View style={styles.filtroRow}>
              <Text style={styles.filtroLabel}>Fecha Fin:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePickerFin(true)}
              >
                <Text style={styles.dateText}>
                  {filtroFechaFin
                    ? filtroFechaFin.toLocaleDateString()
                    : 'Seleccionar'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#3477eb" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lista de compras */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3477eb" />
            <Text style={styles.loadingText}>Cargando compras...</Text>
          </View>
        ) : compras.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay compras registradas</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleInsertarNueva}
            >
              <Text style={styles.emptyButtonText}>Crear Primera Compra</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={compras}
            renderItem={renderCompraItem}
            keyExtractor={(item) => item.idCompra.toString()}
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

        {/* Modal Proveedor */}
        <Modal
          visible={modalProveedorVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalProveedorVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setModalProveedorVisible(false)}
                  style={styles.modalBackButton}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Proveedor</Text>
                <View style={{ width: 28 }} />
              </View>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFiltroProveedor('');
                    setModalProveedorVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>Todos</Text>
                </TouchableOpacity>
                {proveedores.map((prov) => (
                  <TouchableOpacity
                    key={prov.idProveedor}
                    style={styles.modalItem}
                    onPress={() => {
                      setFiltroProveedor(prov.idProveedor.toString());
                      setModalProveedorVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{prov.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Estatus */}
        <Modal
          visible={modalEstatusVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalEstatusVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setModalEstatusVisible(false)}
                  style={styles.modalBackButton}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Estatus</Text>
                <View style={{ width: 28 }} />
              </View>
              <View style={styles.modalContent}>
                {opcionesEstatus.map((opcion) => (
                  <TouchableOpacity
                    key={opcion.value}
                    style={styles.modalItem}
                    onPress={() => {
                      setFiltroEstatus(opcion.value);
                      setModalEstatusVisible(false);
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
    fontSize: 22,
    fontWeight: '700',
    color: '#2f4f7a',
  },
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
  compraFolio: {
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
  compraTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#28a745',
  },
  compraInfo: {
    gap: 8,
  },
  compraInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compraInfoText: {
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
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
