// src/screens/auth/LoginScreen.js

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import useLoginViewModel from '../../hooks/useLoginViewModel';

export default function LoginScreen({ navigation, onLogin }) {
  const {
    username,
    password,
    error,
    loading,
    setUsername,
    setPassword,
    handleSubmit,
  } = useLoginViewModel({ navigation, onLogin });

  // Renderizar el formulario de login
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f9fc" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Contenedor del formulario */}
          <View style={styles.formContainer}>
            {/* Logo */}
            <Image
              source={require('../../../assets/logoFarmacia.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />

            {/* Título */}
            <Text style={styles.title}>BIENVENIDO</Text>
            <Text style={styles.subtitle}>Sistema de Gestión de Inventario</Text>

            {/* Campo de usuario */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Usuario</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                value={username}
                onChangeText={setUsername}
                placeholder="Ingresa tu usuario"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Campo de contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                value={password}
                onChangeText={setPassword}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Mensaje de error */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Botón de inicio de sesión */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.buttonText}>  Validando...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

// Estilos del componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9fc',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5,
  },
  logo: {
    width: 70,
    height: 70,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#3477eb',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontWeight: '500',
    fontSize: 15,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 5,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputError: {
    borderColor: '#ca2525',
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    padding: 12,
    borderRadius: 5,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#ca2525',
  },
  errorText: {
    color: '#ca2525',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    width: '100%',
    padding: 14,
    backgroundColor: '#3477eb',
    borderRadius: 5,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonDisabled: {
    backgroundColor: '#aaa',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
