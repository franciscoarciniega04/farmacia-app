import apiClient from '../services/apiClient';
import { normalizeProducto, normalizeProductos } from '../models/productoModel';

export const productoRepository = {
  async list(filtros = {}) {
    const data = await apiClient.get('/productos/', filtros);
    return normalizeProductos(data || []);
  },

  async get(idProducto) {
    const data = await apiClient.get(`/productos/${idProducto}`);
    return normalizeProducto(data || {});
  },

  async create(producto) {
    const data = await apiClient.post('/productos/', producto);
    return normalizeProducto(data || {});
  },

  async update(idProducto, producto) {
    const data = await apiClient.put(`/productos/${idProducto}`, producto);
    return normalizeProducto(data || {});
  },

  remove(idProducto) {
    return apiClient.delete(`/productos/${idProducto}`);
  },

  ajustarStock(idProducto, data) {
    return apiClient.post(`/productos/${idProducto}/ajustar-stock`, data);
  },

  historial(idProducto) {
    return apiClient.get(`/productos/${idProducto}/historial`);
  },

  estadisticas(idProducto) {
    return apiClient.get(`/productos/${idProducto}/estadisticas`);
  },
};

export default productoRepository;
