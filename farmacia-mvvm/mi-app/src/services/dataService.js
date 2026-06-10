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
import {
  saveProductosLocal,
  getProductosLocal,
  decreaseProductoStockLocal,
  increaseProductoStockLocal,
} from '../database/productosLocalRepository';

import {
  addSyncOperationLocal,
  getSyncQueueLocal,
  removeSyncOperationLocal,
  removeSyncOperationByLocalIdLocal,
  markSyncOperationConflictLocal,
  markSyncOperationPendingLocal,
} from '../database/syncQueueRepository';

import {
  saveVentasLocal,
  getVentasLocal,
  saveVentaOfflineLocal,
  markVentaSyncedLocal,
  markVentaConflictLocal,
  deleteVentaLocal,
} from '../database/ventasLocalRepository';

const CACHE_KEYS = {
  productos: 'cache_productos',
  ventas: 'cache_ventas',
  compras: 'cache_compras',
  proveedores: 'cache_proveedores',
  usuarios: 'cache_usuarios',
  formasPago: 'cache_formas_pago',
  categorias: 'cache_categorias',
  queue: 'sync_queue',
  currentUser: 'current_user',
  lastUsername: 'last_username',
};

class DatabaseService {
  constructor() {
    this.isOnline = true;
    this.listeners = [];
    this.unsubscribeNetInfo = null;
    this.isSyncing = false;
    this.lastSyncAt = null;
  }

  async init() {
    this.isOnline = await this.checkConnection();

    // Si la app abre con internet, intenta sincronizar pendientes
    if (this.isOnline) {
      this.syncAll();
    }

    if (!this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo = networkService.subscribe(async (isConnected) => {
        const wasOffline = !this.isOnline;

        if (!isConnected) {
          this.isOnline = false;
          this.notifyListeners();
          return;
        }

        // Hay red, pero confirmamos que el backend también responda
        const backendAvailable = await this.checkConnection();

        this.notifyListeners();

        // Si venía de offline y el backend ya responde, sincroniza automáticamente
        if (wasOffline && backendAvailable) {
          await this.syncAll();
        }
      });
    }
  }

  async checkConnection() {
  const hasNetwork = await networkService.isConnected();

  if (!hasNetwork) {
    this.isOnline = false;
    return false;
  }

  try {
    await apiClient.get('/health', undefined, { timeout: 4000 });
    this.isOnline = true;
    return true;
  } catch (error) {
    this.isOnline = false;
    return false;
  }
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

  async cacheProductos(productos = []) {
    try {
      const productosArray = Array.isArray(productos)
        ? productos
        : productos?.data || [];

      await saveProductosLocal(productosArray);

      // Respaldo temporal mientras migramos todo a SQLite
      await this.setCached(CACHE_KEYS.productos, productosArray, true);
    } catch (error) {
      console.error('Error guardando productos localmente:', error);
    }
  }

  async getCachedProductos(filtros = {}) {
    try {
      const soloActivos = filtros?.soloActivos === true;

      const productosSQLite = await getProductosLocal({ soloActivos });

      if (productosSQLite.length > 0) {
        return productosSQLite;
      }

      const productosAsync = await this.getCached(CACHE_KEYS.productos);

      return Array.isArray(productosAsync)
        ? productosAsync
        : productosAsync?.data || [];
    } catch (error) {
      console.error('Error leyendo productos locales:', error);
      return [];
    }
  }

  async fetchProductos(filtros = {}) {
    const online = await this.checkConnection();

    if (!online) {
      const cached = await this.getCachedProductos(filtros);

      return {
        data: cached,
        source: 'sqlite',
      };
    }

    try {
      const data = await productoRepository.list(filtros);

      const productosArray = Array.isArray(data)
        ? data
        : data?.data || [];

      await this.cacheProductos(productosArray);

      return {
        data: productosArray,
        source: 'server',
      };
    } catch (error) {
      console.error('Error cargando productos desde servidor:', error);

      const cached = await this.getCachedProductos(filtros);

      return {
        data: cached,
        source: 'sqlite',
        error,
      };
    }
  }

  async getCachedProductos() {
    const productosSQLite = await getProductosLocal();

    if (productosSQLite && productosSQLite.length > 0) {
      return productosSQLite;
    }

    return await this.getCached(CACHE_KEYS.productos);
  }

  async fetchProductos(filtros = {}) {
    const online = await this.checkConnection();

    if (!online) {
      const cached = await this.getCachedProductos();
      return {
        data: cached,
        source: 'cache',
      };
    }

    try {
      const data = await productoRepository.list(filtros);

      await this.cacheProductos(data);

      return {
        data,
        source: 'server',
      };
    } catch (error) {
      console.error('Error cargando productos:', error);

      const cached = await this.getCachedProductos();

      return {
        data: cached,
        source: 'cache',
        error,
      };
    }
  }

  async cacheVentas(ventas) {
    await saveVentasLocal(ventas);
  }

  async getCachedVentas() {
    return await getVentasLocal();
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
    const operationToSave = {
      ...operation,
      createdAt: operation.createdAt || new Date().toISOString(),
      localId: operation.localId || this.buildOperationLocalId(operation),
    };

    // Antes de guardar, eliminamos operaciones anteriores equivalentes.
    await this.removeDuplicatedPendingOperation(operationToSave);

    if (typeof addSyncOperationLocal === 'function') {
      await addSyncOperationLocal(operationToSave);
    } else {
      const queue = await this.getSyncQueue();
      queue.push(operationToSave);
      await AsyncStorage.setItem(CACHE_KEYS.queue, JSON.stringify(queue));
    }

    this.notifyListeners();
  }

  async getSyncQueue() {
    return await getSyncQueueLocal();
  }

  async clearSyncQueue() {
    try {
      const queue = await this.getSyncQueue();

      for (const operation of queue) {
        if (operation.id && typeof removeSyncOperationLocal === 'function') {
          await removeSyncOperationLocal(operation.id);
        }
      }

      await AsyncStorage.removeItem(CACHE_KEYS.queue);

      this.notifyListeners();
    } catch (error) {
      console.error('Error limpiando cola de sincronización:', error);
    }
  }

  getProductStock(producto) {
    return Number(
      producto?.stockActual ??
      producto?.stock ??
      producto?.existencia ??
      producto?.cantidad ??
      0
    );
  }

  getProductName(producto) {
    return (
      producto?.nombreProducto ||
      producto?.nombre ||
      producto?.descripcion ||
      `Producto ${producto?.idProducto}`
    );
  }

  async validateRemoteStockForVenta(operation) {
    const detalles = operation?.data?.detalles || [];

    if (!detalles.length) {
      return true;
    }

    const productosRemotos = await apiClient.get('/productos/');

    const conflictos = [];

    for (const detalle of detalles) {
      const idProducto = Number(detalle.idProducto);
      const cantidadVendida = Number(detalle.cantidad || 0);

      const productoRemoto = productosRemotos.find(
        (producto) => Number(producto.idProducto) === idProducto
      );

      if (!productoRemoto) {
        conflictos.push({
          idProducto,
          producto: `Producto ${idProducto}`,
          solicitado: cantidadVendida,
          disponible: 0,
          motivo: 'Producto no encontrado en la nube',
        });

        continue;
      }

      const stockDisponible = this.getProductStock(productoRemoto);

      if (stockDisponible < cantidadVendida) {
        conflictos.push({
          idProducto,
          producto: this.getProductName(productoRemoto),
          solicitado: cantidadVendida,
          disponible: stockDisponible,
          motivo: 'Stock insuficiente',
        });
      }
    }

    if (conflictos.length > 0) {
      const error = new Error('Conflicto de inventario');
      error.code = 'STOCK_CONFLICT';
      error.conflictos = conflictos;
      throw error;
    }

    return true;
  }

  buildOperationLocalId(operation) {
    if (operation.localId) return operation.localId;

    // Para operaciones de productos:
    // /productos/12
    // /productos/12/
    const productoMatch = operation.endpoint?.match(/\/productos\/(\d+)\/?$/);

    if (productoMatch) {
      return `producto_${productoMatch[1]}`;
    }

    // Para proveedores:
    const proveedorMatch = operation.endpoint?.match(/\/proveedores\/(\d+)\/?$/);

    if (proveedorMatch) {
      return `proveedor_${proveedorMatch[1]}`;
    }

    // Para usuarios:
    const usuarioMatch = operation.endpoint?.match(/\/usuarios\/(\d+)\/?$/);

    if (usuarioMatch) {
      return `usuario_${usuarioMatch[1]}`;
    }

    // Para ventas/compras nuevas dejamos un id único
    if (operation.type === 'venta:create') {
      return `venta_${Date.now()}`;
    }

    if (operation.type === 'compra:create') {
      return `compra_${Date.now()}`;
    }

    return `${operation.type}_${Date.now()}`;
  }

  async removeDuplicatedPendingOperation(operation) {
    try {
      if (!operation.localId) return;

      const queue = await this.getSyncQueue();

      const duplicated = queue.filter(
        (item) =>
          item.localId === operation.localId &&
          item.type === operation.type
      );

      for (const item of duplicated) {
        if (item.id && typeof removeSyncOperationLocal === 'function') {
          await removeSyncOperationLocal(item.id);
        } else if (
          item.localId &&
          typeof removeSyncOperationByLocalIdLocal === 'function'
        ) {
          await removeSyncOperationByLocalIdLocal(item.localId);
        }
      }

      // Fallback AsyncStorage
      if (typeof removeSyncOperationLocal !== 'function') {
        const newQueue = queue.filter(
          (item) =>
            !(
              item.localId === operation.localId &&
              item.type === operation.type
            )
        );

        await AsyncStorage.setItem(CACHE_KEYS.queue, JSON.stringify(newQueue));
      }
    } catch (error) {
      console.error('Error eliminando operación duplicada:', error);
    }
  }

  async markLocalVentaAsConflict(localId, conflictos = []) {
    try {
      const ventas = await this.getCachedVentas();

      const ventasActualizadas = ventas.map((venta) => {
        if (venta.localId !== localId) return venta;

        return {
          ...venta,
          pendienteSync: true,
          estadoSync: 'conflicto',
          conflictosInventario: conflictos,
        };
      });

      await this.cacheVentas(ventasActualizadas);
    } catch (error) {
      console.error('Error marcando venta con conflicto:', error);
    }
  }

  async syncAll() {
    if (this.isSyncing) {
      return;
    }

    const online = await this.checkConnection();
    if (!online) return;

    this.isSyncing = true;

    try {
      const queue = await this.getSyncQueue();

      if (!queue || queue.length === 0) {
        await this.preloadInitialData?.();
        this.lastSyncAt = new Date();
        this.notifyListeners();
        return;
      }

      for (const operation of queue) {
        try {
          // No reintentar automáticamente conflictos de inventario
          if (operation.estadoSync === 'conflicto') {
            continue;
          }

          // Validar stock remoto antes de subir ventas offline
          if (operation.type === 'venta:create') {
            await this.validateRemoteStockForVenta(operation);
          }

          const result = await this.syncOperation(operation);

          // Marcar ventas locales como sincronizadas
          if (operation.type === 'venta:create' && operation.localId) {
            await this.markLocalVentaAsSynced?.(operation.localId, result);
          }

          // Marcar compras locales como sincronizadas
          if (operation.type === 'compra:create' && operation.localId) {
            await this.markLocalCompraAsSynced?.(operation.localId, result);
          }

          // MUY IMPORTANTE:
          // Si la operación salió bien, se elimina de la cola.
          await this.removeSyncedOperation(operation);
        } catch (error) {
          console.error(`Error sincronizando ${operation.type}:`, error);

          if (error.code === 'STOCK_CONFLICT') {
            if (operation.localId) {
              await this.markOperationAsConflict?.(
                operation,
                error.conflictos || []
              );
            }
          }

          // Si falla, NO la eliminamos.
          // Se queda pendiente para reintento posterior.
        }
      }

      await this.preloadInitialData?.();
      this.lastSyncAt = new Date();
      this.notifyListeners();
    } finally {
      this.isSyncing = false;
    }
  }

  async removeSyncedOperation(operation) {
    try {
      // Si estás usando SQLite para sync_queue
      if (operation.id && typeof removeSyncOperationLocal === 'function') {
        await removeSyncOperationLocal(operation.id);
        return;
      }

      // Si la operación tiene localId
      if (
        operation.localId &&
        typeof removeSyncOperationByLocalIdLocal === 'function'
      ) {
        await removeSyncOperationByLocalIdLocal(operation.localId);
        return;
      }

      // Fallback si todavía usas AsyncStorage para la cola
      const queue = await this.getSyncQueue();

      const newQueue = queue.filter((item) => {
        if (operation.id && item.id === operation.id) return false;
        if (operation.localId && item.localId === operation.localId) return false;

        return !(
          item.type === operation.type &&
          item.endpoint === operation.endpoint &&
          item.method === operation.method
        );
      });

      await AsyncStorage.setItem(CACHE_KEYS.queue, JSON.stringify(newQueue));
    } catch (error) {
      console.error('Error eliminando operación sincronizada:', error);
    }
  }
  
  async syncOperation(operation) {
    const { endpoint, method, data } = operation;
    return apiClient.request(endpoint, {
      method,
      body: method !== 'GET' ? data : undefined,
    });
  }

  async saveCurrentUser(user) {
    try {
      await cacheService.set(CACHE_KEYS.currentUser, user);
      if (user?.username) {
        await AsyncStorage.setItem(CACHE_KEYS.lastUsername, user.username);
      }
    } catch (error) {
      console.error('Error guardando usuario local:', error);
    }
  }

  async getCurrentUser() {
    try {
      return await cacheService.get(CACHE_KEYS.currentUser, null);
    } catch (error) {
      console.error('Error leyendo usuario local:', error);
      return null;
    }
  }

  async canUseOfflineLogin(username) {
    try {
      const savedUser = await this.getCurrentUser();

      if (!savedUser || !username) {
        return false;
      }

      return savedUser.username?.toLowerCase() === username.trim().toLowerCase();
    } catch (error) {
      console.error('Error validando login offline:', error);
      return false;
    }
  }

  async preloadInitialData() {
    const online = await this.checkConnection();

    if (!online) {
      return;
    }

    await Promise.allSettled([
      this.fetchProductos({ soloActivos: true }),
      this.fetchProveedores({ soloActivos: true }),
      this.fetchUsuarios(),
      this.fetchVentas(),
      this.fetchCompras(),
      this.fetchCategorias(),
      this.fetchFormasPago(),
    ]);
  }

  async addVentaToCache(ventaLocal) {
    try {
      const ventas = await this.getCachedVentas();

      const nuevasVentas = [
        ventaLocal,
        ...ventas.filter((v) => v.idVenta !== ventaLocal.idVenta),
      ];

      await this.cacheVentas(nuevasVentas);
    } catch (error) {
      console.error('Error agregando venta al caché:', error);
    }
  }

  async addCompraToCache(compraLocal) {
    try {
      const compras = await this.getCachedCompras();

      const nuevasCompras = [
        compraLocal,
        ...compras.filter((c) => c.idCompra !== compraLocal.idCompra),
      ];

      await this.cacheCompras(nuevasCompras);
    } catch (error) {
      console.error('Error agregando compra al caché:', error);
    }
  }

  async increaseLocalStock(detalles = []) {
    try {
      const productos = await this.getCachedProductos();

      const productosActualizados = productos.map((producto) => {
        const detalle = detalles.find(
          (d) => Number(d.idProducto) === Number(producto.idProducto)
        );

        if (!detalle) return producto;

        const stockActual = Number(producto.stockActual ?? producto.stock ?? 0);
        const cantidadComprada = Number(detalle.cantidad || 0);
        const nuevoStock = stockActual + cantidadComprada;

        return {
          ...producto,
          stockActual: nuevoStock,
          stock: nuevoStock,
        };
      });

      await this.cacheProductos(productosActualizados);
    } catch (error) {
      console.error('Error aumentando inventario local:', error);
    }
  }

  async markLocalCompraAsSynced(localId, serverCompra = null) {
    try {
      const compras = await this.getCachedCompras();

      const comprasActualizadas = compras.map((compra) => {
        if (compra.localId !== localId) return compra;

        return {
          ...compra,
          ...(serverCompra || {}),
          idCompra: serverCompra?.idCompra || compra.idCompra,
          pendienteSync: false,
          estadoSync: 'sincronizada',
        };
      });

      await this.cacheCompras(comprasActualizadas);
    } catch (error) {
      console.error('Error marcando compra local como sincronizada:', error);
    }
  }

  async createCompraOffline({ compraData, detallesUI = [], proveedor = null }) {
    const localId = `local_compra_${Date.now()}`;

    const subtotal = detallesUI.reduce((sum, detalle) => {
      const cantidad = Number(detalle.cantidad || 0);
      const precio = Number(detalle.precioCompra || 0);
      return sum + cantidad * precio;
    }, 0);

    const impuestos = subtotal * 0.16;
    const total = subtotal + impuestos;

    const compraLocal = {
      ...compraData,
      idCompra: localId,
      localId,
      pendienteSync: true,
      estadoSync: 'pendiente',
      nombreProveedor: proveedor?.nombre || 'Proveedor local',
      subtotal,
      impuestos,
      total,
      detalles: detallesUI.map((detalle) => ({
        ...detalle,
        subtotal:
          Number(detalle.cantidad || 0) *
          Number(detalle.precioCompra || 0),
      })),
    };

    await this.addToSyncQueue({
      type: 'compra:create',
      endpoint: '/compras/',
      method: 'POST',
      data: compraData,
      localId,
    });

    await this.addCompraToCache(compraLocal);
    await this.increaseLocalStock(compraData.detalles);

    return compraLocal;
  }

  async decreaseLocalStock(detalles = []) {
    try {
      const productos = await this.getCachedProductos();

      const productosActualizados = productos.map((producto) => {
        const detalle = detalles.find(
          (d) => Number(d.idProducto) === Number(producto.idProducto)
        );

        if (!detalle) return producto;

        const stockActual = Number(producto.stockActual ?? producto.stock ?? 0);
        const cantidadVendida = Number(detalle.cantidad || 0);
        const nuevoStock = Math.max(0, stockActual - cantidadVendida);

        return {
          ...producto,
          stockActual: nuevoStock,
          stock: nuevoStock,
        };
      });

      await this.cacheProductos(productosActualizados);
    } catch (error) {
      console.error('Error descontando inventario local:', error);
    }
  }

  async markLocalVentaAsSynced(localId, serverVenta = null) {
    try {
      const ventas = await this.getCachedVentas();

      const ventasActualizadas = ventas.map((venta) => {
        if (venta.localId !== localId) return venta;

        return {
          ...venta,
          ...(serverVenta || {}),
          idVenta: serverVenta?.idVenta || venta.idVenta,
          pendienteSync: false,
          estadoSync: 'sincronizada',
        };
      });

      await this.cacheVentas(ventasActualizadas);
    } catch (error) {
      console.error('Error marcando venta local como sincronizada:', error);
    }
  }

  async createVentaOffline({ ventaData, detallesUI = [], usuario = {}, formaPago = null }) {
    const localId = `local_venta_${Date.now()}`;

    const subtotal = detallesUI.reduce((sum, detalle) => {
      const cantidad = Number(detalle.cantidad || 0);
      const precio = Number(detalle.precio || detalle.precioVenta || 0);
      return sum + cantidad * precio;
    }, 0);

    const impuestos = subtotal * 0.16;
    const total = subtotal + impuestos;

    const ventaLocal = {
      ...ventaData,
      idVenta: localId,
      localId,
      pendienteSync: true,
      estadoSync: 'pendiente',
      fechaVenta: new Date().toISOString(),
      nombreUsuario: usuario?.username || usuario?.nombreUsuario || 'Usuario local',
      formaPago: formaPago?.tipo || formaPago?.formaPago || 'Forma de pago',
      subtotal,
      impuestos,
      total,
      detalles: detallesUI.map((detalle) => ({
        ...detalle,
        subtotal:
          Number(detalle.cantidad || 0) *
          Number(detalle.precio || detalle.precioVenta || 0),
      })),
    };

    await addSyncOperationLocal({
      type: 'venta:create',
      endpoint: '/ventas/',
      method: 'POST',
      data: ventaData,
      localId,
      createdAt: new Date().toISOString(),
    });

    await saveVentaOfflineLocal(ventaLocal);

    for (const detalle of ventaData.detalles || []) {
      await decreaseProductoStockLocal(detalle.idProducto, detalle.cantidad);
    }

    this.notifyListeners();

    return ventaLocal;
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
