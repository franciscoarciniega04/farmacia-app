import * as SQLite from 'expo-sqlite';

let db = null;

export async function getDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('farmacia_offline.db');
  }

  return db;
}

export async function initLocalDatabase() {
  const database = await getDatabase();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS productos (
      idProducto INTEGER PRIMARY KEY,
      nombre TEXT,
      codigo TEXT,
      descripcion TEXT,
      precioVenta REAL DEFAULT 0,
      precioCompra REAL DEFAULT 0,
      stockActual REAL DEFAULT 0,
      stockMinimo REAL DEFAULT 0,
      idCategoria INTEGER,
      estatus INTEGER DEFAULT 1,
      rawJson TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS proveedores (
      idProveedor INTEGER PRIMARY KEY,
      nombre TEXT,
      telefono TEXT,
      correo TEXT,
      direccion TEXT,
      estatus INTEGER DEFAULT 1,
      rawJson TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS clientes (
      idCliente INTEGER PRIMARY KEY,
      nombre TEXT,
      telefono TEXT,
      correo TEXT,
      direccion TEXT,
      estatus INTEGER DEFAULT 1,
      rawJson TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS categorias (
      idCategoria INTEGER PRIMARY KEY,
      nombre TEXT,
      descripcion TEXT,
      estatus INTEGER DEFAULT 1,
      rawJson TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS formas_pago (
      idFormaPago INTEGER PRIMARY KEY,
      tipo TEXT,
      descripcion TEXT,
      estatus INTEGER DEFAULT 1,
      rawJson TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS ventas (
      idVenta TEXT PRIMARY KEY,
      localId TEXT,
      fechaVenta TEXT,
      idUsuario INTEGER,
      idCliente INTEGER,
      idFormaPago INTEGER,
      subtotal REAL DEFAULT 0,
      impuestos REAL DEFAULT 0,
      total REAL DEFAULT 0,
      pendienteSync INTEGER DEFAULT 0,
      estadoSync TEXT DEFAULT 'sincronizada',
      rawJson TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS venta_detalles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idVenta TEXT,
      idProducto INTEGER,
      cantidad REAL DEFAULT 0,
      precio REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      rawJson TEXT
    );

    CREATE TABLE IF NOT EXISTS compras (
      idCompra TEXT PRIMARY KEY,
      localId TEXT,
      fechaCompra TEXT,
      idProveedor INTEGER,
      subtotal REAL DEFAULT 0,
      impuestos REAL DEFAULT 0,
      total REAL DEFAULT 0,
      pendienteSync INTEGER DEFAULT 0,
      estadoSync TEXT DEFAULT 'sincronizada',
      rawJson TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS compra_detalles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idCompra TEXT,
      idProducto INTEGER,
      cantidad REAL DEFAULT 0,
      precioCompra REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      rawJson TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      localId TEXT,
      type TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      dataJson TEXT NOT NULL,
      estadoSync TEXT DEFAULT 'pendiente',
      errorSync TEXT,
      conflictosJson TEXT,
      createdAt TEXT NOT NULL
    );
  `);

  return database;
}