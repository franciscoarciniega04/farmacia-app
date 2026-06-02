export const normalizeCliente = (cliente = {}) => ({
  ...cliente,
  idCliente: Number(cliente.idCliente),
  email: cliente.email ?? cliente.correo ?? '',
  estatus: cliente.estatus === true ? 1 : Number(cliente.estatus ?? 1),
});

export const normalizeClientes = (clientes = []) => clientes.map(normalizeCliente);
