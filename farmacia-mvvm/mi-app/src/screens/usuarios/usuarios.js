// src/screens/usuarios/UsuariosScreen.js

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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useUsuariosViewModel from '../../hooks/useUsuariosViewModel';

export default function UsuariosScreen({ route, navigation }) {
  const {
    usuarioActivo,
    usuarios,
    loading,
    refreshing,
    isOnline,
    dataSource,
    onRefresh,
    handleCrearUsuario,
    handleEditarUsuario,
    esUsuarioActivo,
  } = useUsuariosViewModel({ route, navigation });

  // Renderizar item de usuario
  const renderUsuarioItem = ({ item }) => (
    <TouchableOpacity
      style={styles.usuarioCard}
      onPress={() => handleEditarUsuario(item)}
      activeOpacity={0.7}
    >
      <View style={styles.usuarioHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={60} color="#3477eb" />
          {esUsuarioActivo(item) && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>Activo</Text>
            </View>
          )}
        </View>

        <View style={styles.usuarioInfo}>
          <Text style={styles.usuarioNombre}>
            {item.nombre} {item.apellido}
          </Text>
          <Text style={styles.usuarioUsername}>@{item.username}</Text>
          <View style={styles.rolContainer}>
            <Ionicons name="shield-checkmark" size={14} color="#666" />
            <Text style={styles.rolText}>{item.nombreRol || 'Sin rol'}</Text>
          </View>
        </View>

        <View
          style={[
            styles.estatusBadge,
            { backgroundColor: item.estatus === 1 ? '#28a745' : '#fa3a3a' },
          ]}
        >
          <Text style={styles.estatusText}>
            {item.estatus === 1 ? 'Habilitado' : 'Deshabilitado'}
          </Text>
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
          <Text style={styles.headerTitle}>Usuarios</Text>
          <TouchableOpacity onPress={handleCrearUsuario} style={styles.headerButton}>
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

        {/* Lista de usuarios */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3477eb" />
            <Text style={styles.loadingText}>Cargando usuarios...</Text>
          </View>
        ) : usuarios.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay usuarios registrados</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleCrearUsuario}
            >
              <Text style={styles.emptyButtonText}>Crear Primer Usuario</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={usuarios}
            renderItem={renderUsuarioItem}
            keyExtractor={(item) => item.idUsuario.toString()}
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
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  activeBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#28a745',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  activeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
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
    fontSize: 13,
    color: '#666',
  },
  estatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estatusText: {
    color: '#fff',
    fontSize: 11,
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
});
