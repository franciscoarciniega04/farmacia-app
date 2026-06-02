import apiClient from '../services/apiClient';

export const configuracionRepository = {
  getImpresion() {
    return apiClient.get('/configuracion/impresion');
  },
  updateImpresion(config) {
    return apiClient.put('/configuracion/impresion', config);
  },
  getSeguridad() {
    return apiClient.get('/seguridad/configuracion');
  },
  updateSeguridad(config) {
    return apiClient.put('/seguridad/configuracion', config);
  },
};

export default configuracionRepository;
