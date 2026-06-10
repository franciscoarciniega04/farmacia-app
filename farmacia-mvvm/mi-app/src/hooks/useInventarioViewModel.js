import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import DatabaseService from '../services/dataService';

const normalizarProductoInventario = (producto = {}) => {
  const nombre =
    producto.nombre ||
    producto.nombreProducto ||
    producto.descripcion ||
    'Producto sin nombre';

  const codigo =
    producto.codigo ||
    producto.codigoProducto ||
    '';

  const stockActual = Number(
    producto.stockActual ??
    producto.stock ??
    producto.existencia ??
    0
  );

  const stockMinimo = Number(
    producto.stockMinimo ??
    producto.minimo ??
    0
  );

  return {
    ...producto,
    nombre,
    nombreProducto: producto.nombreProducto || nombre,
    codigo,
    stockActual,
    stock: stockActual,
    stockMinimo,
    estatus: Number(producto.estatus ?? 1),
  };
};

export default function useInventarioViewModel({ route, navigation } = {}) {
  const { usuario } = route?.params || {};
  const [buscarNombre, setBuscarNombre] = useState('');
  const [buscarCodigo, setBuscarCodigo] = useState('');
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [dataSource, setDataSource] = useState('server');

  const cargarInventario = async () => {
    setLoading(true);

    try {
      const result = await DatabaseService.fetchProductos({
        soloActivos: false,
      });

      const productosNormalizados = (result.data || []).map(
        normalizarProductoInventario
      );

      setProductos(productosNormalizados);
      setDataSource(result.source);
      setIsOnline(result.source === 'server');
    } catch (err) {
      console.error('Error al cargar inventario:', err);
      Alert.alert('Error', 'No se pudo cargar el inventario');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const initializeScreen = async () => {
    await DatabaseService.init();
    const status = await DatabaseService.getStatus();

    setIsOnline(status.isOnline);
    await cargarInventario();
  };

  useEffect(() => {
    initializeScreen();
  }, []);

  const productosFiltrados = useMemo(() => {
    const nombreBuscado = buscarNombre.toLowerCase();
    const codigoBuscado = buscarCodigo.toLowerCase();

    return productos.filter((p) => {
      const nombre = String(
        p.nombre ||
        p.nombreProducto ||
        ''
      ).toLowerCase();

      const codigo = String(
        p.codigo ||
        p.codigoProducto ||
        ''
      ).toLowerCase();

      return (
        nombre.includes(nombreBuscado) &&
        codigo.includes(codigoBuscado)
      );
    });
  }, [productos, buscarNombre, buscarCodigo]);

  const esStockBajo = (producto) =>
    Number(producto.stockActual || 0) <= Number(producto.stockMinimo || 0);

  const handleVerHistorial = (producto) =>
    navigation.navigate('HistorialProducto', { producto });

  const limpiarBusqueda = () => {
    setBuscarNombre('');
    setBuscarCodigo('');
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarInventario();
  };

  return {
    usuario,
    buscarNombre,
    setBuscarNombre,
    buscarCodigo,
    setBuscarCodigo,
    productos,
    productosFiltrados,
    loading,
    refreshing,
    isOnline,
    dataSource,
    cargarInventario,
    onRefresh,
    esStockBajo,
    handleVerHistorial,
    limpiarBusqueda,
  };
}