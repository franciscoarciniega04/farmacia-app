import apiClient from '../services/apiClient';
import { normalizeCategoria, normalizeCategorias } from '../models/categoriaModel';

export const categoriaRepository = {
  async list() {
    const data = await apiClient.get('/categorias/');
    return normalizeCategorias(data || []);
  },
  async create(categoria) {
    const data = await apiClient.post('/categorias/', categoria);
    return normalizeCategoria(data || {});
  },
  async update(idCategoria, categoria) {
    const data = await apiClient.put(`/categorias/${idCategoria}`, categoria);
    return normalizeCategoria(data || {});
  },
  remove(idCategoria) {
    return apiClient.delete(`/categorias/${idCategoria}`);
  },
};

export default categoriaRepository;
