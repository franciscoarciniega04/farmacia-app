import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import DatabaseService from '../services/dataService';

export default function useProveedoresViewModel({ route, navigation } = {}) {
  const { usuario } = route?.params || {};
  const [buscarNombre, setBuscarNombre] = useState('');
  const [buscarRFC, setBuscarRFC] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [dataSource, setDataSource] = useState('server');

  const cargarProveedores = async () => {
    setLoading(true);
    try {
      const result = await DatabaseService.fetchProveedores({ soloActivos });
      setProveedores(result.data);
      setDataSource(result.source);
      setIsOnline(result.source === 'server');
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      Alert.alert('Error', 'No se pudieron cargar los proveedores');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const initializeScreen = async () => {
    await DatabaseService.init();
    const status = await DatabaseService.getStatus();
    setIsOnline(status.isOnline);
    cargarProveedores();
  };

  useEffect(() => { initializeScreen(); }, [soloActivos]);

  const proveedoresFiltrados = useMemo(
    () => proveedores.filter(
      (p) =>
        p.nombre.toLowerCase().includes(buscarNombre.toLowerCase()) &&
        p.RFC.toLowerCase().includes(buscarRFC.toLowerCase())
    ),
    [proveedores, buscarNombre, buscarRFC]
  );

  const onRefresh = () => { setRefreshing(true); cargarProveedores(); };
  const handleInsertarNuevo = () => navigation.navigate('InsertarProveedor', { usuario, onProveedorGuardado: cargarProveedores });
  const handleEditarProveedor = (proveedor) => navigation.navigate('InsertarProveedor', { usuario, proveedor, onProveedorGuardado: cargarProveedores });
  const limpiarBusqueda = () => { setBuscarNombre(''); setBuscarRFC(''); };

  return {
    usuario,
    buscarNombre,
    setBuscarNombre,
    buscarRFC,
    setBuscarRFC,
    soloActivos,
    setSoloActivos,
    proveedores,
    proveedoresFiltrados,
    loading,
    refreshing,
    isOnline,
    dataSource,
    cargarProveedores,
    onRefresh,
    handleInsertarNuevo,
    handleEditarProveedor,
    limpiarBusqueda,
  };
}
