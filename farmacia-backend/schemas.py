from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class RolCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None


class RolUpdate(RolCreate):
    pass


class UsuarioCreate(BaseModel):
    nombre: str
    apellido: str
    username: str
    password: Optional[str] = None
    idRol: int
    estatus: int = 1


class UsuarioUpdate(BaseModel):
    nombre: str
    apellido: str
    username: Optional[str] = None
    password: Optional[str] = None
    idRol: int
    estatus: int = 1


class CategoriaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None


class CategoriaUpdate(CategoriaCreate):
    pass


class ProductoCreate(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    stockMinimo: int
    stockActual: int
    idCategoria: int
    estatus: int = 1


class ProductoUpdate(ProductoCreate):
    pass


class AjusteStockRequest(BaseModel):
    nuevaCantidad: int
    comentario: Optional[str] = "Ajuste manual de inventario"


class ProveedorCreate(BaseModel):
    nombre: str
    RFC: str
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    estado: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    estatus: int = 1


class ProveedorUpdate(ProveedorCreate):
    pass


class ClienteCreate(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    estatus: int = 1


class ClienteUpdate(ClienteCreate):
    pass


class DetalleVentaCreate(BaseModel):
    idProducto: int
    cantidad: int
    precio: float


class VentaCreate(BaseModel):
    idUsuario: int
    idFormaPago: int
    fechaVenta: date
    detalles: List[DetalleVentaCreate]


class DetalleCompraCreate(BaseModel):
    idProducto: int
    cantidad: int
    precioCompra: float


class CompraCreate(BaseModel):
    idProveedor: int
    fechaCompra: date
    estatus: str = "Pendiente"
    detalles: List[DetalleCompraCreate]


class ConfiguracionImpresionSchema(BaseModel):
    nombre_farmacia: str = ""
    direccion: str = ""
    telefono: str = ""
    rfc: str = ""
    incluir_logo_ticket: bool = True
    incluir_rfc_ticket: bool = True
    incluir_direccion_ticket: bool = True
    mensaje_pie_ticket: str = "¡Gracias por su compra!"
    tamano_etiqueta: str = "50x30mm"
    incluir_codigo_barras: bool = True
    incluir_precio_etiqueta: bool = True
    incluir_logo_reporte: bool = True
    orientacion_reporte: str = "vertical"
    tamano_papel_reporte: str = "carta"


class ConfiguracionSeguridadSchema(BaseModel):
    longitud_minima_password: int = 8
    requerir_mayusculas: bool = True
    requerir_minusculas: bool = True
    requerir_numeros: bool = True
    requerir_caracteres_especiales: bool = False
    dias_expiracion_password: int = 90
    tiempo_sesion_minutos: int = 480
    cerrar_sesion_inactividad: bool = True
    minutos_inactividad: int = 30
    permitir_sesiones_multiples: bool = False
    intentos_login_permitidos: int = 5
    minutos_bloqueo_cuenta: int = 30
    requerir_cambio_password_primer_login: bool = True
    registrar_acciones_usuarios: bool = True
    registrar_cambios_datos: bool = True
    dias_retencion_logs: int = 90
