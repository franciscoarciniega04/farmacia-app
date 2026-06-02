import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  guardarPruebaCloud,
  leerPruebasCloud,
} from '../../services/firebaseService';

export default function PruebaCloudScreen({ route, navigation }) {
  const { usuario } = route.params || {};

  const [mensaje, setMensaje] = useState('');
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resultado = await leerPruebasCloud();
      setDatos(resultado);
    } catch (error) {
      console.error('Error al leer Firestore:', error);
      Alert.alert('Error', 'No se pudieron leer los datos desde la nube');
    } finally {
      setLoading(false);
    }
  };

  const guardarDato = async () => {
    if (!mensaje.trim()) {
      Alert.alert('Error', 'Escribe un mensaje de prueba');
      return;
    }

    setLoading(true);
    try {
      await guardarPruebaCloud({
        mensaje,
        usuario: usuario?.username || usuario?.nombre || 'Usuario de prueba',
        modulo: 'Actividad 8 - Firebase Firestore',
      });

      setMensaje('');
      Alert.alert('Éxito', 'Dato guardado correctamente en Firestore');
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar en Firestore:', error);
      Alert.alert('Error', 'No se pudo guardar el dato en la nube');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    try {
      if (!fecha) return 'Sin fecha';
      if (fecha.toDate) return fecha.toDate().toLocaleString();
      return String(fecha);
    } catch {
      return 'Sin fecha';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.mensaje}>{item.mensaje}</Text>
      <Text style={styles.detalle}>Usuario: {item.usuario}</Text>
      <Text style={styles.detalle}>Módulo: {item.modulo}</Text>
      <Text style={styles.fecha}>{formatearFecha(item.fecha)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={26} color="#3477eb" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Prueba en la Nube</Text>

          <TouchableOpacity onPress={cargarDatos} style={styles.headerButton}>
            <Ionicons name="refresh" size={24} color="#3477eb" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="cloud-done" size={28} color="#3477eb" />
            <Text style={styles.infoText}>
              Esta pantalla guarda y lee datos reales desde Firebase Firestore.
            </Text>
          </View>

          <Text style={styles.label}>Mensaje de prueba</Text>
          <TextInput
            style={styles.input}
            value={mensaje}
            onChangeText={setMensaje}
            placeholder="Ejemplo: Prueba desde Expo"
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={guardarDato}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#fff" />
                <Text style={styles.buttonText}>Guardar en Firestore</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Datos leídos desde la nube</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#3477eb" />
          ) : (
            <FlatList
              data={datos}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  Aún no hay datos registrados en Firestore
                </Text>
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f7ff',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  headerButton: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2f4f7a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#3477eb',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3477eb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2f4f7a',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3477eb',
  },
  mensaje: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2f4f7a',
    marginBottom: 4,
  },
  detalle: {
    fontSize: 13,
    color: '#666',
  },
  fecha: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 30,
  },
});