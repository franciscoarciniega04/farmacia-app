import { useState } from 'react';

export default function useMenuPrincipal(navigation, usuario) {

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { icon: 'cart', label: 'VENTAS', screen: 'Ventas' },
    { icon: 'cube', label: 'PRODUCTOS', screen: 'Productos' },
    { icon: 'grid', label: 'INVENTARIO', screen: 'Inventario' },
    { icon: 'receipt', label: 'COMPRAS', screen: 'Compras' },
    { icon: 'people', label: 'PROVEEDORES', screen: 'Proveedores' },
    { icon: 'document-text', label: 'REPORTES', screen: 'Reportes' },
    { icon: 'settings', label: 'AJUSTES', screen: 'Ajustes' },
    { icon: 'person', label: 'USUARIOS', screen: 'Usuarios' },
  ];

  const navigateToModule = (screen) => {
    navigation.navigate(screen, { usuario });
  };

  const logout = () => {
    setShowLogoutConfirm(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return {
    showLogoutConfirm,
    setShowLogoutConfirm,
    menuItems,
    navigateToModule,
    logout,
  };
}
