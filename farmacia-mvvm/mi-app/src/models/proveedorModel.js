export const normalizeProveedor = (proveedor = {}) => ({
  ...proveedor,
  idProveedor: Number(proveedor.idProveedor),
  RFC: proveedor.RFC ?? proveedor.rfc ?? '',
  correo: proveedor.correo ?? proveedor.email ?? '',
  estatus: proveedor.estatus === true ? 1 : Number(proveedor.estatus ?? 1),
});

export const normalizeProveedores = (proveedores = []) => proveedores.map(normalizeProveedor);
