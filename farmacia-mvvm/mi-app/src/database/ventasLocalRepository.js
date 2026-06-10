import { getDatabase } from './localDb';

export async function saveVentasLocal(ventas = []) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    for (const venta of ventas) {
      const idVenta = String(venta.idVenta || venta.localId);

      await db.runAsync(
        `
        INSERT OR REPLACE INTO ventas (
          idVenta,
          localId,
          fechaVenta,
          idUsuario,
          idCliente,
          idFormaPago,
          subtotal,
          impuestos,
          total,
          pendienteSync,
          estadoSync,
          rawJson,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          idVenta,
          venta.localId || null,
          venta.fechaVenta || now,
          venta.idUsuario || null,
          venta.idCliente || null,
          venta.idFormaPago || null,
          Number(venta.subtotal || 0),
          Number(venta.impuestos || 0),
          Number(venta.total || 0),
          venta.pendienteSync ? 1 : 0,
          venta.estadoSync || 'sincronizada',
          JSON.stringify(venta),
          now,
        ]
      );

      await db.runAsync(
        `
        DELETE FROM venta_detalles
        WHERE idVenta = ?
        `,
        [idVenta]
      );

      const detalles = venta.detalles || [];

      for (const detalle of detalles) {
        await db.runAsync(
          `
          INSERT INTO venta_detalles (
            idVenta,
            idProducto,
            cantidad,
            precio,
            subtotal,
            rawJson
          ) VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            idVenta,
            Number(detalle.idProducto),
            Number(detalle.cantidad || 0),
            Number(detalle.precio || detalle.precioVenta || 0),
            Number(detalle.subtotal || 0),
            JSON.stringify(detalle),
          ]
        );
      }
    }
  });
}

export async function getVentasLocal() {
  const db = await getDatabase();

  const ventas = await db.getAllAsync(`
    SELECT *
    FROM ventas
    ORDER BY fechaVenta DESC
  `);

  const result = [];

  for (const venta of ventas) {
    const detalles = await db.getAllAsync(
      `
      SELECT *
      FROM venta_detalles
      WHERE idVenta = ?
      `,
      [venta.idVenta]
    );

    const raw = venta.rawJson ? JSON.parse(venta.rawJson) : {};

    result.push({
      ...raw,
      idVenta: venta.idVenta,
      localId: venta.localId,
      fechaVenta: venta.fechaVenta,
      idUsuario: venta.idUsuario,
      idCliente: venta.idCliente,
      idFormaPago: venta.idFormaPago,
      subtotal: venta.subtotal,
      impuestos: venta.impuestos,
      total: venta.total,
      pendienteSync: venta.pendienteSync === 1,
      estadoSync: venta.estadoSync,
      detalles: detalles.map((detalle) => ({
        ...(detalle.rawJson ? JSON.parse(detalle.rawJson) : {}),
        idProducto: detalle.idProducto,
        cantidad: detalle.cantidad,
        precio: detalle.precio,
        subtotal: detalle.subtotal,
      })),
    });
  }

  return result;
}

export async function saveVentaOfflineLocal(venta) {
  await saveVentasLocal([venta]);
}

export async function markVentaSyncedLocal(localId, serverVenta = {}) {
  const db = await getDatabase();

  await db.runAsync(
    `
    UPDATE ventas
    SET pendienteSync = 0,
        estadoSync = 'sincronizada',
        rawJson = ?,
        updatedAt = ?
    WHERE localId = ?
    `,
    [JSON.stringify(serverVenta), new Date().toISOString(), localId]
  );
}

export async function markVentaConflictLocal(localId, conflictos = []) {
  const db = await getDatabase();

  const venta = await db.getFirstAsync(
    `
    SELECT rawJson
    FROM ventas
    WHERE localId = ?
    `,
    [localId]
  );

  const raw = venta?.rawJson ? JSON.parse(venta.rawJson) : {};

  const updated = {
    ...raw,
    pendienteSync: true,
    estadoSync: 'conflicto',
    conflictosInventario: conflictos,
  };

  await db.runAsync(
    `
    UPDATE ventas
    SET pendienteSync = 1,
        estadoSync = 'conflicto',
        rawJson = ?,
        updatedAt = ?
    WHERE localId = ?
    `,
    [JSON.stringify(updated), new Date().toISOString(), localId]
  );
}

export async function deleteVentaLocal(localId) {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    const venta = await db.getFirstAsync(
      `
      SELECT idVenta
      FROM ventas
      WHERE localId = ? OR idVenta = ?
      `,
      [localId, localId]
    );

    if (!venta) return;

    await db.runAsync(
      `
      DELETE FROM venta_detalles
      WHERE idVenta = ?
      `,
      [venta.idVenta]
    );

    await db.runAsync(
      `
      DELETE FROM ventas
      WHERE idVenta = ?
      `,
      [venta.idVenta]
    );
  });
}