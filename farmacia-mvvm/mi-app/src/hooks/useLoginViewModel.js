import { useState } from 'react';
import { Alert } from 'react-native';
import authRepository from '../repositories/authRepository';
import DatabaseService from '../services/dataService';

export default function useLoginViewModel({ navigation, onLogin } = {}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUsernameChange = (value) => {
    setUsername(value);
    setError('');
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setError('');
  };

  const goToMenu = (user) => {
    if (onLogin) {
      onLogin(user);
    } else if (navigation) {
      navigation.replace('MenuPrincipal', { usuario: user });
    }
  };

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await DatabaseService.init();

      const online = await DatabaseService.checkConnection();

      if (online) {
        const data = await authRepository.login({ username, password });

        await DatabaseService.saveCurrentUser(data);

        // Precarga catálogos para que después pueda usarse sin internet
        DatabaseService.preloadInitialData();

        goToMenu(data);
        return;
      }

      const canLoginOffline = await DatabaseService.canUseOfflineLogin(username);

      if (canLoginOffline) {
        const cachedUser = await DatabaseService.getCurrentUser();

        Alert.alert(
          'Modo offline',
          'Entraste sin conexión usando la última sesión guardada en este dispositivo.'
        );

        goToMenu({
          ...cachedUser,
          modoOffline: true,
        });

        return;
      }

      throw new Error(
        'No hay conexión y no existe una sesión guardada para este usuario.'
      );
    } catch (err) {
      const errorMessage = err?.message || 'Usuario o contraseña incorrectos!';
      setError(errorMessage);
      Alert.alert('Error de autenticación', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    username,
    password,
    error,
    loading,
    setUsername: handleUsernameChange,
    setPassword: handlePasswordChange,
    handleSubmit,
  };
}