import apiClient from '../services/apiClient';
import { normalizeRol, normalizeRoles } from '../models/rolModel';

export const rolRepository = {
  async list() {
    const data = await apiClient.get('/roles/');
    return normalizeRoles(data || []);
  },
  async create(rol) {
    const data = await apiClient.post('/roles/', rol);
    return normalizeRol(data || {});
  },
  async update(idRol, rol) {
    const data = await apiClient.put(`/roles/${idRol}`, rol);
    return normalizeRol(data || {});
  },
  remove(idRol) {
    return apiClient.delete(`/roles/${idRol}`);
  },
};

export default rolRepository;
