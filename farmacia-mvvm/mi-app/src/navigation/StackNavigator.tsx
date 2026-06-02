// src/navigation/StackNavigator.tsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Importación de pantallas
import LoginScreen from '../screens/auth/LoginScreen';
import MenuPrincipalScreen from '../screens/home/MenuPrincipal';
import VentasScreen from '../screens/ventas/ventas';
import InsertarVentaScreen from '../screens/ventas/insertarVenta';
import ProductosScreen from '../screens/productos/producots';
import InsertarProductoScreen from '../screens/productos/insertarProducto';
import ProveedoresScreen from '..//screens/proveedores/proveedores';
import InsertarProveedorScreen from '../screens/proveedores/insertarProveedor';
import ComprasScreen from '../screens/compras/compras';
import InsertarCompraScreen from '../screens/compras/insertarCompra';
import InventarioScreen from '../screens/inventario/inventario';
import HistorialProductoScreen from '../screens/inventario/historialProducto';
import UsuariosScreen from '../screens/usuarios/usuarios';
import InsertarUsuarioScreen from '../screens/usuarios/insertarUsuario';
import ReportesScreen from '../screens/reportes/reportes';
import ReporteVentasScreen from '../screens/reportes/reporteVentas';
import ReporteProductosVendidosScreen from '../screens/reportes/reporteProductosVendidos';
import ReporteInventarioScreen from '../screens/reportes/reporteInventario';
import ReporteComprasScreen from '../screens/reportes/reporteCompras';
import ReporteUsuariosScreen from '../screens/reportes/reporteUsuarios';
import AjusteInventarioScreen from '../screens/ajustes/ajusteInventario';
import AjustesScreen from '../screens/ajustes/ajustes';
import GestionCategoriasScreen from '../screens/ajustes/gestionCategorias';
import GestionClientesScreen from '../screens/ajustes/gestionClientes';
import GestionRolesScreen from '../screens/ajustes/gestionRoles';
import ConfiguracionImpresionScreen from '../screens/ajustes/configuracionImpresion';
import ConfiguracionSeguridadScreen from '../screens/ajustes/configuracionSeguridad';
import ExportarDatosScreen from '../screens/ajustes/exportarDatos';
import PruebaCloudScreen from '../screens/ajustes/pruebaCloudScreen';

// Definición de los tipos para los parámetros de navegación
export type RootStackParamList = {
  Login: undefined;
  MenuPrincipal: { usuario: any };
  Ventas: { usuario: any };
  Productos: { usuario: any };
  Inventario: { usuario: any };
  Compras: { usuario: any };
  Proveedores: { usuario: any };
  Reportes: { usuario: any };
  Ajustes: { usuario: any };
  Usuarios: { usuario: any };
  PruebaCloud: { usuario?: any } | undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
      />
      <Stack.Screen 
        name="MenuPrincipal" 
        component={MenuPrincipalScreen}
      />
      <Stack.Screen 
        name="Ventas" 
        component={VentasScreen}
      />
      <Stack.Screen 
        name="InsertarVenta" 
        component={InsertarVentaScreen}
       /> 
      <Stack.Screen 
        name="Productos" 
        component={ProductosScreen}
      />
      <Stack.Screen 
        name="InsertarProducto" 
        component={InsertarProductoScreen}
      />
      <Stack.Screen 
        name="Proveedores" 
        component={ProveedoresScreen}
      />
      <Stack.Screen 
        name="InsertarProveedor" 
        component={InsertarProveedorScreen}
      />
      <Stack.Screen 
        name="Compras" 
        component={ComprasScreen}
      />
      <Stack.Screen 
        name="InsertarCompra" 
        component={InsertarCompraScreen}
      />
      <Stack.Screen 
        name="Inventario" 
        component={InventarioScreen}
      />
      <Stack.Screen 
        name="HistorialProducto" 
        component={HistorialProductoScreen}
      />
      <Stack.Screen 
        name="Usuarios" 
        component={UsuariosScreen}
      />
      <Stack.Screen 
        name="InsertarUsuario" 
        component={InsertarUsuarioScreen}
      />
      <Stack.Screen 
        name="Reportes" 
        component={ReportesScreen}
      />
      <Stack.Screen 
        name="ReporteVentas" 
        component={ReporteVentasScreen}
      />
      <Stack.Screen 
        name="ReporteCompras" 
        component={ReporteComprasScreen}
      />
      <Stack.Screen 
        name="ReporteInventario" 
        component={ReporteInventarioScreen}
      />
      <Stack.Screen 
        name="ReporteProductosVendidos" 
        component={ReporteProductosVendidosScreen}
      />
      <Stack.Screen 
        name="ReporteUsuarios" 
        component={ReporteUsuariosScreen}
      />
      <Stack.Screen 
        name="Ajustes" 
        component={AjustesScreen}
      />
      <Stack.Screen 
        name="GestionClientes" 
        component={GestionClientesScreen}
      />
      <Stack.Screen 
        name="GestionRoles" 
        component={GestionRolesScreen}
      />
      <Stack.Screen 
        name="GestionCategorias" 
        component={GestionCategoriasScreen}
      />
      <Stack.Screen 
        name="AjusteInventario" 
        component={AjusteInventarioScreen}
      />
      <Stack.Screen 
        name="ExportarDatos" 
        component={ExportarDatosScreen}
      />
      <Stack.Screen 
        name="ConfiguracionImpresion" 
        component={ConfiguracionImpresionScreen}
      />
      <Stack.Screen 
        name="ConfiguracionSeguridad" 
        component={ConfiguracionSeguridadScreen}
      />
      <Stack.Screen
        name="PruebaCloud"
        component={PruebaCloudScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
