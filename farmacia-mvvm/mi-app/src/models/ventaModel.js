export const normalizeVenta = (venta = {}) => ({
  ...venta,
  idVenta: Number(venta.idVenta),
  idUsuario: venta.idUsuario !== undefined && venta.idUsuario !== null ? Number(venta.idUsuario) : venta.idUsuario,
  idFormaPago: venta.idFormaPago !== undefined && venta.idFormaPago !== null ? Number(venta.idFormaPago) : venta.idFormaPago,
  subtotal: Number(venta.subtotal ?? 0),
  nombreUsuario: venta.nombreUsuario ?? venta.username ?? venta.usuario ?? '',
  formaPago: venta.formaPago ?? venta.tipoFormaPago ?? venta.tipo ?? '',
  detalles: venta.detalles ?? [],
});

export const normalizeVentas = (ventas = []) => ventas.map(normalizeVenta);
