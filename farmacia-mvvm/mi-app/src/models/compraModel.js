export const normalizeCompra = (compra = {}) => ({
  ...compra,
  idCompra: Number(compra.idCompra),
  idProveedor: compra.idProveedor !== undefined && compra.idProveedor !== null ? Number(compra.idProveedor) : compra.idProveedor,
  subtotal: Number(compra.subtotal ?? 0),
  nombreProveedor: compra.nombreProveedor ?? compra.proveedor ?? '',
  detalles: compra.detalles ?? [],
});

export const normalizeCompras = (compras = []) => compras.map(normalizeCompra);
