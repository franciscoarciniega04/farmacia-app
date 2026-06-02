import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import DatabaseService from '../services/dataService';

export default function useVentasViewModel({ route, navigation } = {}) {
  const { usuario } = route?.params || {};
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroFormaPago, setFiltroFormaPago] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState(null);
  const [filtroFechaFin, setFiltroFechaFin] = useState(null);
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFin, setShowDatePickerFin] = useState(false);
  const [ventas, setVentas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalUsuarioVisible, setModalUsuarioVisible] = useState(false);
  const [modalFormaPagoVisible, setModalFormaPagoVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [dataSource, setDataSource] = useState('server');

  const cargarUsuarios = async () => {
    try {
      const result = await DatabaseService.fetchUsuarios();
      setUsuarios(result.data);
      setIsOnline(result.source === 'server');
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  const cargarFormasPago = async () => {
    try {
      const result = await DatabaseService.fetchFormasPago();
      setFormasPago(result.data);
    } catch (err) {
      console.error('Error al cargar formas de pago:', err);
    }
  };

  const cargarVentas = async () => {
    setLoading(true);
    try {
      const filtros = {};
      if (filtroUsuario) filtros.idUsuario = filtroUsuario;
      if (filtroFormaPago) filtros.idFormaPago = filtroFormaPago;
      if (filtroFechaInicio) filtros.fechaInicio = filtroFechaInicio.toISOString().split('T')[0];
      if (filtroFechaFin) filtros.fechaFin = filtroFechaFin.toISOString().split('T')[0];
      const result = await DatabaseService.fetchVentas(filtros);
      setVentas(result.data);
      setDataSource(result.source);
      setIsOnline(result.source === 'server');
    } catch (err) {
      console.error('Error al cargar ventas:', err);
      Alert.alert('Error', isOnline ? 'No se pudieron cargar las ventas' : 'Sin conexión. Mostrando datos guardados.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const initializeScreen = async () => {
    await DatabaseService.init();
    const status = await DatabaseService.getStatus();
    setIsOnline(status.isOnline);
    cargarUsuarios();
    cargarFormasPago();
    cargarVentas();
  };

  useEffect(() => { initializeScreen(); }, []);
  useEffect(() => { cargarVentas(); }, [filtroUsuario, filtroFormaPago, filtroFechaInicio, filtroFechaFin]);

  const onRefresh = () => { setRefreshing(true); cargarVentas(); };
  const handleInsertarNueva = () => navigation.navigate('InsertarVenta', { usuario, onVentaGuardada: cargarVentas });
  const handleVerVenta = (venta) => navigation.navigate('InsertarVenta', { usuario, venta, onVentaGuardada: cargarVentas });
  const limpiarFiltros = () => { setFiltroUsuario(''); setFiltroFormaPago(''); setFiltroFechaInicio(null); setFiltroFechaFin(null); };
  const hayFiltrosActivos = () => filtroUsuario || filtroFormaPago || filtroFechaInicio || filtroFechaFin;
  const getTextoUsuarioSeleccionado = () => {
    if (!filtroUsuario) return 'Seleccionar usuario';
    const user = usuarios.find((u) => u.idUsuario === filtroUsuario || u.idUsuario === parseInt(filtroUsuario));
    return user ? user.username : 'Seleccionar usuario';
  };
  const getTextoFormaPagoSeleccionada = () => {
    if (!filtroFormaPago) return 'Seleccionar forma de pago';
    const formaPago = formasPago.find((fp) => fp.idFormaPago === filtroFormaPago || fp.idFormaPago === parseInt(filtroFormaPago));
    return formaPago ? formaPago.tipo : 'Seleccionar forma de pago';
  };

  return {
    usuario,
    mostrarFiltros,
    setMostrarFiltros,
    filtroUsuario,
    setFiltroUsuario,
    filtroFormaPago,
    setFiltroFormaPago,
    filtroFechaInicio,
    setFiltroFechaInicio,
    filtroFechaFin,
    setFiltroFechaFin,
    showDatePickerInicio,
    setShowDatePickerInicio,
    showDatePickerFin,
    setShowDatePickerFin,
    ventas,
    usuarios,
    formasPago,
    loading,
    refreshing,
    modalUsuarioVisible,
    setModalUsuarioVisible,
    modalFormaPagoVisible,
    setModalFormaPagoVisible,
    isOnline,
    dataSource,
    cargarVentas,
    onRefresh,
    handleInsertarNueva,
    handleVerVenta,
    limpiarFiltros,
    hayFiltrosActivos,
    getTextoUsuarioSeleccionado,
    getTextoFormaPagoSeleccionada,
  };
}
