import { getDatabase } from './localDb';

export async function saveProductosLocal(productos = []) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    for (const producto of productos) {
      await db.runAsync(
        `
        INSERT OR REPLACE INTO productos (
          idProducto,
          nombre,
          codigo,
          descripcion,
          precioVenta,
          precioCompra,
          stockActual,
          stockMinimo,
          idCategoria,
          estatus,
          rawJson,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Number(producto.idProducto),
          producto.nombreProducto || producto.nombre || '',
          producto.codigo || producto.codigoProducto || '',
          producto.descripcion || '',
          Number(producto.precioVenta || producto.precio || 0),
          Number(producto.precioCompra || 0),
          Number(producto.stockActual ?? producto.stock ?? 0),
          Number(producto.stockMinimo || 0),
          producto.idCategoria ? Number(producto.idCategoria) : null,
          Number(producto.estatus ?? 1),
          JSON.stringify(producto),
          now,
        ]
      );
    }
  });
}

export async function getProductosLocal() {
  const db = await getDatabase();

  const rows = await db.getAllAsync(`
    SELECT *
    FROM productos
    WHERE estatus = 1
    ORDER BY nombre ASC
  `);

  return rows.map((row) => {
    const raw = row.rawJson ? JSON.parse(row.rawJson) : {};

    return {
      ...raw,
      idProducto: row.idProducto,
      nombreProducto: raw.nombreProducto || row.nombre,
      nombre: row.nombre,
      codigo: row.codigo,
      descripcion: row.descripcion,
      precioVenta: row.precioVenta,
      precioCompra: row.precioCompra,
      stockActual: row.stockActual,
      stock: row.stockActual,
      stockMinimo: row.stockMinimo,
      idCategoria: row.idCategoria,
      estatus: row.estatus,
    };
  });
}

export async function decreaseProductoStockLocal(idProducto, cantidad) {
  const db = await getDatabase();

  await db.runAsync(
    `
    UPDATE productos
    SET stockActual = MAX(0, stockActual - ?),
        updatedAt = ?
    WHERE idProducto = ?
    `,
    [Number(cantidad), new Date().toISOString(), Number(idProducto)]
  );
}

export async function increaseProductoStockLocal(idProducto, cantidad) {
  const db = await getDatabase();

  await db.runAsync(
    `
    UPDATE productos
    SET stockActual = stockActual + ?,
        updatedAt = ?
    WHERE idProducto = ?
    `,
    [Number(cantidad), new Date().toISOString(), Number(idProducto)]
  );
}

export async function getProductoLocalById(idProducto) {
  const db = await getDatabase();

  const row = await db.getFirstAsync(
    `
    SELECT *
    FROM productos
    WHERE idProducto = ?
    `,
    [Number(idProducto)]
  );

  if (!row) return null;

  const raw = row.rawJson ? JSON.parse(row.rawJson) : {};

  return {
    ...raw,
    idProducto: row.idProducto,
    nombreProducto: raw.nombreProducto || row.nombre,
    nombre: row.nombre,
    stockActual: row.stockActual,
    stock: row.stockActual,
  };
}