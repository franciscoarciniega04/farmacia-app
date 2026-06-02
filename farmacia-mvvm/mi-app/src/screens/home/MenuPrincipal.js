// src/screens/MenuPrincipalScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function MenuPrincipalScreen({ route, navigation }) {
  const { usuario } = route.params || {};
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Definición de los elementos del menú principal
  const menuItems = [
    {
      icon: 'cart',
      label: 'VENTAS',
      screen: 'Ventas',
      gradient: ['#38a5fa', '#4beccd'],
    },
    {
      icon: 'cube',
      label: 'PRODUCTOS',
      screen: 'Productos',
      gradient: ['#38a5fa', '#4beccd'],
    },
    {
      icon: 'grid',
      label: 'INVENTARIO',
      screen: 'Inventario',
      gradient: ['#38a5fa', '#4beccd'],
    },
    {
      icon: 'receipt',
      label: 'COMPRAS',
      screen: 'Compras',
      gradient: ['#38a5fa', '#4beccd'],
    },
    {
      icon: 'people',
      label: 'PROVEEDORES',
      screen: 'Proveedores',
      gradient: ['#38a5fa', '#4beccd'],
    },
    {
      icon: 'document-text',
      label: 'REPORTES',
      screen: 'Reportes',
      gradient: ['#38a5fa', '#4beccd'],
    },
    {
      icon: 'settings',
      label: 'AJUSTES',
      screen: 'Ajustes',
      gradient: ['#38a5fa', '#4beccd'],
    },
    {
      icon: 'person',
      label: 'USUARIOS',
      screen: 'Usuarios',
      gradient: ['#38a5fa', '#4beccd'],
    },
  ];

  const handleModuloPress = (item) => {
    if (item.screen === 'Ventas') {
      navigation.navigate('Ventas', { usuario });
    } else if (item.screen === 'Productos') {
      navigation.navigate('Productos', { usuario });
    } else if (item.screen === 'Proveedores') {
      navigation.navigate('Proveedores', { usuario });
    } else if (item.screen === 'Compras') {
      navigation.navigate('Compras', { usuario });
    } else if (item.screen === 'Inventario') {
      navigation.navigate('Inventario', { usuario });
    } else if (item.screen === 'Usuarios') {
      navigation.navigate('Usuarios', { usuario });
    } else if (item.screen === 'Reportes') {
      navigation.navigate('Reportes', { usuario });
    } else if (item.screen === 'Ajustes') {
      navigation.navigate('Ajustes', { usuario });
    } else {
      Alert.alert(
        item.label,
        `Módulo ${item.label} (Próximamente)`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Header*/}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image
              source={require('../../../assets/logoFarmacia.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.headerText}>
              <Text style={styles.title}>SGIV-A</Text>
              <Text style={styles.subtitle}>Sistema de Gestión de Inventario</Text>
            </View>
          </View>
        </View>

        {/* Info del usuario */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <Ionicons name="person-circle" size={28} color="#3477eb" />
            <Text style={styles.userName}>{usuario?.nombre || 'Usuario'}</Text>
          </View>
        </View>

        {/* Grid de Módulos con scroll */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridContainer}>
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.moduleCard}
                onPress={() => handleModuloPress(item)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardContent, { backgroundColor: '#3477eb' }]}>
                  <Ionicons name={item.icon} size={40} color="#fff" />
                  <Text style={styles.moduleLabel}>{item.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Footer con botón de cerrar sesión */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setShowLogoutConfirm(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={22} color="#fff" />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de Confirmación */}
        <Modal
          visible={showLogoutConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowLogoutConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="help-circle-outline" size={64} color="#3477eb" />
              <Text style={styles.modalTitle}>
                ¿Estás seguro que deseas cerrar sesión?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonYes]}
                  onPress={handleLogout}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>Sí</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonNo]}
                  onPress={() => setShowLogoutConfirm(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>No</Text>
                </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 12,
    borderRadius: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2f4f7a',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  userSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    marginLeft: 10,
    fontSize: 17,
    fontWeight: '600',
    color: '#2f4f7a',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleCard: {
    width: (width - 60) / 2, // 2 columnas con espaciado
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    borderRadius: 16,
  },
  moduleLabel: {
    color: '#fff',
    marginTop: 12,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e3e3e3',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3477eb',
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonYes: {
    backgroundColor: '#3477eb',
  },
  modalButtonNo: {
    backgroundColor: '#aaa',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
