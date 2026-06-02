import apiClient from '../services/apiClient';

export const formasPagoRepository = {
  async list() {
    const data = await apiClient.get('/formasPago/');
    return (data || []).map((formaPago) => ({
      ...formaPago,
      idFormaPago: Number(formaPago.idFormaPago),
      tipo: formaPago.tipo ?? formaPago.nombre ?? '',
    }));
  },
};

export default formasPagoRepository;
