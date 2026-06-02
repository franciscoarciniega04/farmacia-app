import apiClient from '../services/apiClient';
import { normalizeVenta, normalizeVentas } from '../models/ventaModel';

export const ventaRepository = {
  async list(filtros = {}) {
    const data = await apiClient.get('/ventas/', filtros);
    return normalizeVentas(data || []);
  },
  async get(idVenta) {
    const data = await apiClient.get(`/ventas/${idVenta}`);
    return normalizeVenta(data || {});
  },
  async create(venta) {
    const data = await apiClient.post('/ventas/', venta);
    return normalizeVenta(data || {});
  },
  async update(idVenta, venta) {
    const data = await apiClient.put(`/ventas/${idVenta}`, venta);
    return normalizeVenta(data || {});
  },
};

export default ventaRepository;
