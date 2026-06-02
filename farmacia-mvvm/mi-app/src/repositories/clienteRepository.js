import apiClient from '../services/apiClient';
import { normalizeCliente, normalizeClientes } from '../models/clienteModel';

export const clienteRepository = {
  async list(filtros = {}) {
    const data = await apiClient.get('/clientes/', filtros);
    return normalizeClientes(data || []);
  },
  async create(cliente) {
    const data = await apiClient.post('/clientes/', cliente);
    return normalizeCliente(data || {});
  },
  async update(idCliente, cliente) {
    const data = await apiClient.put(`/clientes/${idCliente}`, cliente);
    return normalizeCliente(data || {});
  },
  remove(idCliente) {
    return apiClient.delete(`/clientes/${idCliente}`);
  },
};

export default clienteRepository;
