import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import DatabaseService from '../services/dataService';

export default function useComprasViewModel({ route, navigation } = {}) {
  const { usuario } = route?.params || {};
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState(null);
  const [filtroFechaFin, setFiltroFechaFin] = useState(null);
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFin, setShowDatePickerFin] = useState(false);
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalProveedorVisible, setModalProveedorVisible] = useState(false);
  const [modalEstatusVisible, setModalEstatusVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [dataSource, setDataSource] = useState('server');
  const opcionesEstatus = [
    { value: '', label: 'Todos' },
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'Realizada', label: 'Realizada' },
    { value: 'Cancelada', label: 'Cancelada' },
  ];

  const cargarProveedores = async () => {
    try {
      const result = await DatabaseService.fetchProveedores({ soloActivos: true });
      setProveedores(result.data);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    }
  };

  const cargarCompras = async () => {
    setLoading(true);
    try {
      const filtros = {};
      if (filtroProveedor) filtros.idProveedor = filtroProveedor;
      if (filtroFechaInicio) filtros.fechaInicio = filtroFechaInicio.toISOString().split('T')[0];
      if (filtroFechaFin) filtros.fechaFin = filtroFechaFin.toISOString().split('T')[0];
      if (filtroEstatus) filtros.estatus = filtroEstatus;
      const result = await DatabaseService.fetchCompras(filtros);
      setCompras(result.data);
      setDataSource(result.source);
      setIsOnline(result.source === 'server');
    } catch (err) {
      console.error('Error al cargar compras:', err);
      Alert.alert('Error', 'No se pudieron cargar las compras');
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
    cargarCompras();
  };

  useEffect(() => { initializeScreen(); }, []);
  useEffect(() => { cargarCompras(); }, [filtroProveedor, filtroFechaInicio, filtroFechaFin, filtroEstatus]);

  const onRefresh = () => { setRefreshing(true); cargarCompras(); };
  const handleInsertarNueva = () => navigation.navigate('InsertarCompra', { usuario, onCompraGuardada: cargarCompras });
  const handleVerCompra = (compra) => navigation.navigate('InsertarCompra', { usuario, compra, onCompraGuardada: cargarCompras });
  const limpiarFiltros = () => { setFiltroProveedor(''); setFiltroFechaInicio(null); setFiltroFechaFin(null); setFiltroEstatus(''); };
  const hayFiltrosActivos = () => filtroProveedor || filtroFechaInicio || filtroFechaFin || filtroEstatus;
  const getTextoProveedorSeleccionado = () => {
    if (!filtroProveedor) return 'Todos';
    const prov = proveedores.find((p) => p.idProveedor === parseInt(filtroProveedor));
    return prov ? prov.nombre : 'Todos';
  };
  const getTextoEstatusSeleccionado = () => {
    const opcion = opcionesEstatus.find((op) => op.value === filtroEstatus);
    return opcion ? opcion.label : 'Todos';
  };
  const getColorEstatus = (estatus) => {
    switch (estatus) {
      case 'Realizada': return '#28a745';
      case 'Pendiente': return '#FDC13B';
      case 'Cancelada': return '#fa3a3a';
      default: return '#6c757d';
    }
  };

  return {
    usuario,
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
    cargarCompras,
    onRefresh,
    handleInsertarNueva,
    handleVerCompra,
    limpiarFiltros,
    hayFiltrosActivos,
    getTextoProveedorSeleccionado,
    getTextoEstatusSeleccionado,
    getColorEstatus,
  };
}
