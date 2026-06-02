// src/services/dataService.js
// Fachada de datos usada por las pantallas existentes.
// En MVVM, esta clase funciona como coordinador entre ViewModels, repositories,
// caché local y estado de red para conservar la compatibilidad con el código anterior.
import AsyncStorage from '@react-native-async-storage/async-storage';
import networkService from './networkService';
import cacheService from './cacheService';
import apiClient from './apiClient';
import productoRepository from '../repositories/productoRepository';
import ventaRepository from '../repositories/ventaRepository';
import compraRepository from '../repositories/compraRepository';
import proveedorRepository from '../repositories/proveedorRepository';
import usuarioRepository from '../repositories/usuarioRepository';
import formasPagoRepository from '../repositories/formasPagoRepository';
import categoriaRepository from '../repositories/categoriaRepository';

const CACHE_KEYS = {
  productos: 'cache_productos',
  ventas: 'cache_ventas',
  compras: 'cache_compras',
  proveedores: 'cache_proveedores',
  usuarios: 'cache_usuarios',
  formasPago: 'cache_formas_pago',
  categorias: 'cache_categorias',
  queue: 'sync_queue',
};

class DatabaseService {
  constructor() {
    this.isOnline = true;
    this.listeners = [];
    this.unsubscribeNetInfo = null;
  }

  async init() {
    this.isOnline = await networkService.isConnected();

    if (!this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo = networkService.subscribe((isConnected) => {
        const wasOffline = !this.isOnline;
        this.isOnline = isConnected;
        this.notifyListeners();

        if (wasOffline && this.isOnline) {
          this.syncAll();
        }
      });
    }
  }

  async checkConnection() {
    this.isOnline = await networkService.isConnected();
    return this.isOnline;
  }

  addConnectionListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach((callback) => callback(this.isOnline));
  }

  async getCached(key) {
    try {
      return await cacheService.get(key, []);
    } catch (error) {
      console.error(`Error leyendo caché ${key}:`, error);
      return [];
    }
  }

  async setCached(key, data, withTimestamp = false) {
    try {
      await cacheService.set(key, data, { timestamp: withTimestamp });
    } catch (error) {
      console.error(`Error guardando caché ${key}:`, error);
    }
  }

  async fetchWithCache({ key, loader, withTimestamp = false }) {
    const online = await this.checkConnection();

    if (!online) {
      const cached = await this.getCached(key);
      return { data: cached, source: 'cache' };
    }

    try {
      const data = await loader();
      await this.setCached(key, data, withTimestamp);
      return { data, source: 'server' };
    } catch (error) {
      console.error(`Error cargando datos para ${key}:`, error);
      const cached = await this.getCached(key);
      return { data: cached, source: 'cache', error };
    }
  }

  async cacheProductos(productos) {
    return this.setCached(CACHE_KEYS.productos, productos, true);
  }

  async getCachedProductos() {
    return this.getCached(CACHE_KEYS.productos);
  }

  async fetchProductos(filtros = {}) {
    return this.fetchWithCache({
      key: CACHE_KEYS.productos,
      withTimestamp: true,
      loader: () => productoRepository.list(filtros),
    });
  }

  async cacheVentas(ventas) {
    return this.setCached(CACHE_KEYS.ventas, ventas, true);
  }

  async getCachedVentas() {
    return this.getCached(CACHE_KEYS.ventas);
  }

  async fetchVentas(filtros = {}) {
    return this.fetchWithCache({
      key: CACHE_KEYS.ventas,
      withTimestamp: true,
      loader: () => ventaRepository.list(filtros),
    });
  }

  async cacheCompras(compras) {
    return this.setCached(CACHE_KEYS.compras, compras, true);
  }

  async getCachedCompras() {
    return this.getCached(CACHE_KEYS.compras);
  }

  async fetchCompras(filtros = {}) {
    return this.fetchWithCache({
      key: CACHE_KEYS.compras,
      withTimestamp: true,
      loader: () => compraRepository.list(filtros),
    });
  }

  async cacheProveedores(proveedores) {
    return this.setCached(CACHE_KEYS.proveedores, proveedores);
  }

  async getCachedProveedores() {
    return this.getCached(CACHE_KEYS.proveedores);
  }

  async fetchProveedores(filtros = {}) {
    return this.fetchWithCache({
      key: CACHE_KEYS.proveedores,
      loader: () => proveedorRepository.list(filtros),
    });
  }

  async cacheUsuarios(usuarios) {
    return this.setCached(CACHE_KEYS.usuarios, usuarios);
  }

  async getCachedUsuarios() {
    return this.getCached(CACHE_KEYS.usuarios);
  }

  async fetchUsuarios(filtros = {}) {
    return this.fetchWithCache({
      key: CACHE_KEYS.usuarios,
      loader: () => usuarioRepository.list(filtros),
    });
  }

  async cacheFormasPago(formasPago) {
    return this.setCached(CACHE_KEYS.formasPago, formasPago);
  }

  async getCachedFormasPago() {
    return this.getCached(CACHE_KEYS.formasPago);
  }

  async fetchFormasPago() {
    return this.fetchWithCache({
      key: CACHE_KEYS.formasPago,
      loader: () => formasPagoRepository.list(),
    });
  }

  async cacheCategorias(categorias) {
    return this.setCached(CACHE_KEYS.categorias, categorias);
  }

  async getCachedCategorias() {
    return this.getCached(CACHE_KEYS.categorias);
  }

  async fetchCategorias() {
    return this.fetchWithCache({
      key: CACHE_KEYS.categorias,
      loader: () => categoriaRepository.list(),
    });
  }

  async addToSyncQueue(operation) {
    try {
      const queue = await this.getSyncQueue();
      queue.push({
        ...operation,
        timestamp: Date.now(),
        id: `${operation.type}_${Date.now()}_${Math.random()}`,
      });
      await AsyncStorage.setItem(CACHE_KEYS.queue, JSON.stringify(queue));
    } catch (error) {
      console.error('Error agregando a sync queue:', error);
    }
  }

  async getSyncQueue() {
    try {
      const queue = await AsyncStorage.getItem(CACHE_KEYS.queue);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error leyendo sync queue:', error);
      return [];
    }
  }

  async syncAll() {
    const online = await this.checkConnection();
    if (!online) return;

    const queue = await this.getSyncQueue();
    if (queue.length === 0) return;

    const failedOperations = [];

    for (const operation of queue) {
      try {
        await this.syncOperation(operation);
      } catch (error) {
        console.error(`Error sincronizando ${operation.type}:`, error);
        failedOperations.push(operation);
      }
    }

    await AsyncStorage.setItem(CACHE_KEYS.queue, JSON.stringify(failedOperations));
  }

  async syncOperation(operation) {
    const { endpoint, method, data } = operation;
    return apiClient.request(endpoint, {
      method,
      body: method !== 'GET' ? data : undefined,
    });
  }

  async clearCache() {
    await AsyncStorage.multiRemove([
      CACHE_KEYS.productos,
      `${CACHE_KEYS.productos}_timestamp`,
      CACHE_KEYS.ventas,
      `${CACHE_KEYS.ventas}_timestamp`,
      CACHE_KEYS.compras,
      `${CACHE_KEYS.compras}_timestamp`,
      CACHE_KEYS.proveedores,
      CACHE_KEYS.usuarios,
      CACHE_KEYS.formasPago,
      CACHE_KEYS.categorias,
      CACHE_KEYS.queue,
    ]);
  }

  async getStatus() {
    const queue = await this.getSyncQueue();
    const lastSync = await cacheService.getTimestamp(CACHE_KEYS.productos);

    return {
      isOnline: this.isOnline,
      pendingOperations: queue.length,
      lastSync,
    };
  }
}

export default new DatabaseService();
