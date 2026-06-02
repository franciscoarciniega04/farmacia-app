import apiClient from '../services/apiClient';

export const exportacionRepository = {
  exportar(tipo) {
    return apiClient.get(`/exportar/${tipo}`, undefined, { responseType: 'blob' });
  },
  backup() {
    return apiClient.post('/backup/crear', undefined, { responseType: 'blob' });
  },
};

export default exportacionRepository;
