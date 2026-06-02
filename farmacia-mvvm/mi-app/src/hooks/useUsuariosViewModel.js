import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import DatabaseService from '../services/dataService';

export default function useUsuariosViewModel({ route, navigation } = {}) {
  const { usuario: usuarioActivo } = route?.params || {};
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [dataSource, setDataSource] = useState('server');

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const result = await DatabaseService.fetchUsuarios();
      setUsuarios(result.data);
      setDataSource(result.source);
      setIsOnline(result.source === 'server');
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
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
  };

  useEffect(() => { initializeScreen(); }, []);

  const onRefresh = () => { setRefreshing(true); cargarUsuarios(); };
  const handleCrearUsuario = () => navigation.navigate('InsertarUsuario', { usuarioActivo, onUsuarioGuardado: cargarUsuarios });
  const handleEditarUsuario = (usuario) => navigation.navigate('InsertarUsuario', { usuarioActivo, usuario, onUsuarioGuardado: cargarUsuarios });
  const esUsuarioActivo = (usuario) => usuarioActivo && usuario.idUsuario === usuarioActivo.idUsuario;

  return {
    usuarioActivo,
    usuarios,
    loading,
    refreshing,
    isOnline,
    dataSource,
    cargarUsuarios,
    onRefresh,
    handleCrearUsuario,
    handleEditarUsuario,
    esUsuarioActivo,
  };
}
