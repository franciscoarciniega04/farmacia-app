import apiClient from '../services/apiClient';
import { normalizeUsuario, normalizeUsuarios } from '../models/usuarioModel';

export const usuarioRepository = {
  async list(filtros = {}) {
    const data = await apiClient.get('/usuarios/', filtros);
    return normalizeUsuarios(data || []);
  },
  async create(usuario) {
    const data = await apiClient.post('/usuarios/', usuario);
    return normalizeUsuario(data || {});
  },
  async update(idUsuario, usuario) {
    const data = await apiClient.put(`/usuarios/${idUsuario}`, usuario);
    return normalizeUsuario(data || {});
  },
  remove(idUsuario) {
    return apiClient.delete(`/usuarios/${idUsuario}`);
  },
};

export default usuarioRepository;
