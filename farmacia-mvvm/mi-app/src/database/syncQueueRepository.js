import { getDatabase } from './localDb';

export async function addSyncOperationLocal(operation) {
  const db = await getDatabase();

  await db.runAsync(
    `
    INSERT INTO sync_queue (
      localId,
      type,
      endpoint,
      method,
      dataJson,
      estadoSync,
      errorSync,
      conflictosJson,
      createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      operation.localId || null,
      operation.type,
      operation.endpoint,
      operation.method,
      JSON.stringify(operation.data || {}),
      operation.estadoSync || 'pendiente',
      operation.errorSync || null,
      operation.conflictosInventario
        ? JSON.stringify(operation.conflictosInventario)
        : null,
      operation.createdAt || new Date().toISOString(),
    ]
  );
}

export async function getSyncQueueLocal() {
  const db = await getDatabase();

  const rows = await db.getAllAsync(`
    SELECT *
    FROM sync_queue
    ORDER BY id ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    localId: row.localId,
    type: row.type,
    endpoint: row.endpoint,
    method: row.method,
    data: row.dataJson ? JSON.parse(row.dataJson) : {},
    estadoSync: row.estadoSync,
    errorSync: row.errorSync,
    conflictosInventario: row.conflictosJson
      ? JSON.parse(row.conflictosJson)
      : [],
    timestamp: row.createdAt,
  }));
}

export async function removeSyncOperationLocal(id) {
  const db = await getDatabase();

  await db.runAsync(
    `
    DELETE FROM sync_queue
    WHERE id = ?
    `,
    [Number(id)]
  );
}

export async function removeSyncOperationByLocalIdLocal(localId) {
  const db = await getDatabase();

  await db.runAsync(
    `
    DELETE FROM sync_queue
    WHERE localId = ?
    `,
    [localId]
  );
}

export async function markSyncOperationConflictLocal(localId, conflictos = []) {
  const db = await getDatabase();

  await db.runAsync(
    `
    UPDATE sync_queue
    SET estadoSync = 'conflicto',
        errorSync = 'Conflicto de inventario',
        conflictosJson = ?
    WHERE localId = ?
    `,
    [JSON.stringify(conflictos), localId]
  );
}

export async function markSyncOperationPendingLocal(localId) {
  const db = await getDatabase();

  await db.runAsync(
    `
    UPDATE sync_queue
    SET estadoSync = 'pendiente',
        errorSync = NULL,
        conflictosJson = NULL
    WHERE localId = ?
    `,
    [localId]
  );
}