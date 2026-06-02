export const normalizeProducto = (producto = {}) => {
  const stockActual = Number(producto.stockActual ?? producto.stock ?? 0);
  const precio = Number(producto.precio ?? producto.precioVenta ?? producto.precioCompra ?? 0);

  return {
    ...producto,
    idProducto: Number(producto.idProducto),
    idCategoria: producto.idCategoria !== undefined && producto.idCategoria !== null ? Number(producto.idCategoria) : producto.idCategoria,
    precio,
    precioVenta: Number(producto.precioVenta ?? precio),
    precioCompra: Number(producto.precioCompra ?? precio),
    stockActual,
    stock: stockActual,
    stockMinimo: Number(producto.stockMinimo ?? 0),
    estatus: producto.estatus === true ? 1 : Number(producto.estatus ?? 1),
    categoria: producto.categoria ?? producto.nombreCategoria ?? '',
  };
};

export const normalizeProductos = (productos = []) => productos.map(normalizeProducto);
