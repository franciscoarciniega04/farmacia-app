import apiClient from '../services/apiClient';
import { normalizeCompra, normalizeCompras } from '../models/compraModel';

export const compraRepository = {
  async list(filtros = {}) {
    const data = await apiClient.get('/compras/', filtros);
    return normalizeCompras(data || []);
  },
  async get(idCompra) {
    const data = await apiClient.get(`/compras/${idCompra}`);
    return normalizeCompra(data || {});
  },
  async create(compra) {
    const data = await apiClient.post('/compras/', compra);
    return normalizeCompra(data || {});
  },
  async update(idCompra, compra) {
    const data = await apiClient.put(`/compras/${idCompra}`, compra);
    return normalizeCompra(data || {});
  },
};

export default compraRepository;
