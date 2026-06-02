import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import DatabaseService from '../services/dataService';

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
      const result = await DatabaseService.fetchProductos({ soloActivos: false });
      setProductos(result.data);
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
    cargarInventario();
  };

  useEffect(() => {
    initializeScreen();
  }, []);

  const productosFiltrados = useMemo(
    () => productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(buscarNombre.toLowerCase()) &&
        p.codigo.toLowerCase().includes(buscarCodigo.toLowerCase())
    ),
    [productos, buscarNombre, buscarCodigo]
  );

  const esStockBajo = (producto) => Number(producto.stockActual) <= Number(producto.stockMinimo);
  const handleVerHistorial = (producto) => navigation.navigate('HistorialProducto', { producto });
  const limpiarBusqueda = () => { setBuscarNombre(''); setBuscarCodigo(''); };
  const onRefresh = () => { setRefreshing(true); cargarInventario(); };

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
