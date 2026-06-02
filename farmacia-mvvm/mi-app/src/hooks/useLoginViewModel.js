import { useState } from 'react';
import { Alert } from 'react-native';
import authRepository from '../repositories/authRepository';

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

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await authRepository.login({ username, password });

      if (onLogin) {
        onLogin(data);
      } else if (navigation) {
        navigation.replace('MenuPrincipal', { usuario: data });
      }
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
