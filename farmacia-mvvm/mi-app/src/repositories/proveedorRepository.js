import apiClient from '../services/apiClient';
import { normalizeProveedor, normalizeProveedores } from '../models/proveedorModel';

export const proveedorRepository = {
  async list(filtros = {}) {
    const data = await apiClient.get('/proveedores/', filtros);
    return normalizeProveedores(data || []);
  },
  async create(proveedor) {
    const data = await apiClient.post('/proveedores/', proveedor);
    return normalizeProveedor(data || {});
  },
  async update(idProveedor, proveedor) {
    const data = await apiClient.put(`/proveedores/${idProveedor}`, proveedor);
    return normalizeProveedor(data || {});
  },
  remove(idProveedor) {
    return apiClient.delete(`/proveedores/${idProveedor}`);
  },
};

export default proveedorRepository;
