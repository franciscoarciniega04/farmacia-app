import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DatabaseService from '../services/dataService';

export default function SyncStatusBar() {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [conflictCount, setConflictCount] = useState(0);

  const loadStatus = async () => {
    try {
      const isOnline = await DatabaseService.checkConnection();
      const queue = await DatabaseService.getSyncQueue();

      const conflictCount = queue.filter(
        (operation) => operation.estadoSync === 'conflicto'
      ).length;

      const pendingCount = queue.length - conflictCount;

      setOnline(isOnline);
      setPendingCount(pendingCount);
      setConflictCount(conflictCount);
    } catch (error) {
      setOnline(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await DatabaseService.syncAll();
      await loadStatus();
    } catch (error) {
      console.error('Error sincronizando manualmente:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadStatus();

    const unsubscribe = DatabaseService.addConnectionListener(() => {
      loadStatus();
    });

    const interval = setInterval(() => {
      loadStatus();
    }, 10000);

    return () => {
       unsubscribe?.();
      clearInterval(interval);
    };
  }, []);

  const backgroundColor = online ? '#DCFCE7' : '#FEE2E2';
  const textColor = online ? '#166534' : '#991B1B';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]}>
        {online ? 'Conectado' : 'Modo offline'} ·{' '}
        {conflictCount > 0
          ? `${conflictCount} conflicto${conflictCount === 1 ? '' : 's'} de inventario`
          : pendingCount === 0
            ? 'Todo sincronizado'
            : `${pendingCount} pendiente${pendingCount === 1 ? '' : 's'} por sincronizar`}
      </Text>

      {online && pendingCount > 0 && conflictCount === 0 && (
        <TouchableOpacity
          style={styles.button}
          onPress={handleSync}
          disabled={syncing}
        >
          <Text style={styles.buttonText}>
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    marginTop: 6,
    alignSelf: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});