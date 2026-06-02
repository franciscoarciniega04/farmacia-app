import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import DatabaseService from '../services/dataService';

export default function useProductosViewModel({ route, navigation } = {}) {
  const { usuario } = route?.params || {};
  const [buscarNombre, setBuscarNombre] = useState('');
  const [buscarCodigo, setBuscarCodigo] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [dataSource, setDataSource] = useState('server');

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const result = await DatabaseService.fetchProductos({ soloActivos });
      setProductos(result.data);
      setDataSource(result.source);
      setIsOnline(result.source === 'server');
    } catch (err) {
      console.error('Error al cargar productos:', err);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const initializeScreen = async () => {
    await DatabaseService.init();
    const status = await DatabaseService.getStatus();
    setIsOnline(status.isOnline);
    cargarProductos();
  };

  useEffect(() => {
    initializeScreen();
  }, [soloActivos]);

  const productosFiltrados = useMemo(
    () => productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(buscarNombre.toLowerCase()) &&
        p.codigo.toLowerCase().includes(buscarCodigo.toLowerCase())
    ),
    [productos, buscarNombre, buscarCodigo]
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargarProductos();
  };

  const handleInsertarNuevo = () => {
    navigation.navigate('InsertarProducto', {
      usuario,
      onProductoGuardado: cargarProductos,
    });
  };

  const handleEditarProducto = (producto) => {
    navigation.navigate('InsertarProducto', {
      usuario,
      producto,
      onProductoGuardado: cargarProductos,
    });
  };

  const limpiarBusqueda = () => {
    setBuscarNombre('');
    setBuscarCodigo('');
  };

  return {
    usuario,
    buscarNombre,
    setBuscarNombre,
    buscarCodigo,
    setBuscarCodigo,
    soloActivos,
    setSoloActivos,
    productos,
    productosFiltrados,
    loading,
    refreshing,
    isOnline,
    dataSource,
    cargarProductos,
    onRefresh,
    handleInsertarNuevo,
    handleEditarProducto,
    limpiarBusqueda,
  };
}
