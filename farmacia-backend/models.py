from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Numeric,
    Date,
    DateTime,
    ForeignKey,
    Boolean,
    func,
)
from sqlalchemy.orm import relationship
from database import Base


class Rol(Base):
    __tablename__ = "roles"

    idRol = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(80), nullable=False, unique=True)
    descripcion = Column(String(255), nullable=True)

    usuarios = relationship("Usuario", back_populates="rol")


class Usuario(Base):
    __tablename__ = "usuarios"

    idUsuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    username = Column(String(80), nullable=False, unique=True, index=True)
    password = Column(String(255), nullable=False)
    idRol = Column(Integer, ForeignKey("roles.idRol"), nullable=False)
    estatus = Column(Integer, default=1)

    rol = relationship("Rol", back_populates="usuarios")
    ventas = relationship("Venta", back_populates="usuario")


class Categoria(Base):
    __tablename__ = "categorias"

    idCategoria = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)
    descripcion = Column(String(255), nullable=True)
    estatus = Column(Integer, default=1)

    productos = relationship("Producto", back_populates="categoria")


class Producto(Base):
    __tablename__ = "productos"

    idProducto = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(80), nullable=False, unique=True, index=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=True)
    precio = Column(Numeric(10, 2), nullable=False, default=0)
    stockMinimo = Column(Integer, nullable=False, default=0)
    stockActual = Column(Integer, nullable=False, default=0)
    idCategoria = Column(Integer, ForeignKey("categorias.idCategoria"), nullable=False)
    estatus = Column(Integer, default=1)

    categoria = relationship("Categoria", back_populates="productos")
    detalles_venta = relationship("DetalleVenta", back_populates="producto")
    detalles_compra = relationship("DetalleCompra", back_populates="producto")
    movimientos = relationship("InventarioMovimiento", back_populates="producto")


class Proveedor(Base):
    __tablename__ = "proveedores"

    idProveedor = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    RFC = Column(String(30), nullable=False, unique=True, index=True)
    direccion = Column(String(255), nullable=True)
    ciudad = Column(String(100), nullable=True)
    estado = Column(String(100), nullable=True)
    telefono = Column(String(50), nullable=True)
    correo = Column(String(120), nullable=True)
    estatus = Column(Integer, default=1)

    compras = relationship("Compra", back_populates="proveedor")


class Cliente(Base):
    __tablename__ = "clientes"

    idCliente = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    telefono = Column(String(50), nullable=True)
    email = Column(String(120), nullable=True)
    direccion = Column(String(255), nullable=True)
    estatus = Column(Integer, default=1)


class FormaPago(Base):
    __tablename__ = "formas_pago"

    idFormaPago = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(80), nullable=False, unique=True)
    estatus = Column(Integer, default=1)

    ventas = relationship("Venta", back_populates="forma_pago")


class Venta(Base):
    __tablename__ = "ventas"

    idVenta = Column(Integer, primary_key=True, index=True)
    idUsuario = Column(Integer, ForeignKey("usuarios.idUsuario"), nullable=False)
    idFormaPago = Column(Integer, ForeignKey("formas_pago.idFormaPago"), nullable=False)
    fechaVenta = Column(Date, nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False, default=0)

    usuario = relationship("Usuario", back_populates="ventas")
    forma_pago = relationship("FormaPago", back_populates="ventas")
    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")


class DetalleVenta(Base):
    __tablename__ = "detalle_ventas"

    idDetalleVenta = Column(Integer, primary_key=True, index=True)
    idVenta = Column(Integer, ForeignKey("ventas.idVenta"), nullable=False)
    idProducto = Column(Integer, ForeignKey("productos.idProducto"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio = Column(Numeric(10, 2), nullable=False)

    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto", back_populates="detalles_venta")


class Compra(Base):
    __tablename__ = "compras"

    idCompra = Column(Integer, primary_key=True, index=True)
    idProveedor = Column(Integer, ForeignKey("proveedores.idProveedor"), nullable=False)
    fechaCompra = Column(Date, nullable=False)
    estatus = Column(String(30), nullable=False, default="Pendiente")
    subtotal = Column(Numeric(10, 2), nullable=False, default=0)

    proveedor = relationship("Proveedor", back_populates="compras")
    detalles = relationship("DetalleCompra", back_populates="compra", cascade="all, delete-orphan")


class DetalleCompra(Base):
    __tablename__ = "detalle_compras"

    idDetalleCompra = Column(Integer, primary_key=True, index=True)
    idCompra = Column(Integer, ForeignKey("compras.idCompra"), nullable=False)
    idProducto = Column(Integer, ForeignKey("productos.idProducto"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precioCompra = Column(Numeric(10, 2), nullable=False)

    compra = relationship("Compra", back_populates="detalles")
    producto = relationship("Producto", back_populates="detalles_compra")


class InventarioMovimiento(Base):
    __tablename__ = "inventario_movimientos"

    idMovimiento = Column(Integer, primary_key=True, index=True)
    idProducto = Column(Integer, ForeignKey("productos.idProducto"), nullable=False)
    tipo = Column(String(50), nullable=False)  # Venta, Compra, Ajuste Manual
    tipoMovimiento = Column(String(20), nullable=False)  # entrada, salida, ajuste
    cantidad = Column(Integer, nullable=False)
    fecha = Column(DateTime, server_default=func.now(), nullable=False)
    usuario = Column(String(150), nullable=True)
    referencia = Column(String(120), nullable=True)
    precioUnitario = Column(Numeric(10, 2), nullable=True)
    total = Column(Numeric(10, 2), nullable=True)
    comentario = Column(String(255), nullable=True)

    producto = relationship("Producto", back_populates="movimientos")


class ConfiguracionImpresion(Base):
    __tablename__ = "configuracion_impresion"

    id = Column(Integer, primary_key=True, default=1)
    nombre_farmacia = Column(String(150), default="")
    direccion = Column(String(255), default="")
    telefono = Column(String(50), default="")
    rfc = Column(String(30), default="")
    incluir_logo_ticket = Column(Boolean, default=True)
    incluir_rfc_ticket = Column(Boolean, default=True)
    incluir_direccion_ticket = Column(Boolean, default=True)
    mensaje_pie_ticket = Column(String(255), default="¡Gracias por su compra!")
    tamano_etiqueta = Column(String(30), default="50x30mm")
    incluir_codigo_barras = Column(Boolean, default=True)
    incluir_precio_etiqueta = Column(Boolean, default=True)
    incluir_logo_reporte = Column(Boolean, default=True)
    orientacion_reporte = Column(String(30), default="vertical")
    tamano_papel_reporte = Column(String(30), default="carta")


class ConfiguracionSeguridad(Base):
    __tablename__ = "configuracion_seguridad"

    id = Column(Integer, primary_key=True, default=1)
    longitud_minima_password = Column(Integer, default=8)
    requerir_mayusculas = Column(Boolean, default=True)
    requerir_minusculas = Column(Boolean, default=True)
    requerir_numeros = Column(Boolean, default=True)
    requerir_caracteres_especiales = Column(Boolean, default=False)
    dias_expiracion_password = Column(Integer, default=90)
    tiempo_sesion_minutos = Column(Integer, default=480)
    cerrar_sesion_inactividad = Column(Boolean, default=True)
    minutos_inactividad = Column(Integer, default=30)
    permitir_sesiones_multiples = Column(Boolean, default=False)
    intentos_login_permitidos = Column(Integer, default=5)
    minutos_bloqueo_cuenta = Column(Integer, default=30)
    requerir_cambio_password_primer_login = Column(Boolean, default=True)
    registrar_acciones_usuarios = Column(Boolean, default=True)
    registrar_cambios_datos = Column(Boolean, default=True)
    dias_retencion_logs = Column(Integer, default=90)
