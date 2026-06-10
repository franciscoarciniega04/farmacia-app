import csv
import hashlib
import io
import os
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
import bcrypt

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, StreamingResponse
from sqlalchemy import and_, func
from sqlalchemy.orm import Session, joinedload

import models
import schemas
from database import Base, engine, get_db, SessionLocal


IVA = Decimal("0.16")

app = FastAPI(title="Farmacia API", version="1.0.0")

cors_origins = os.getenv("CORS_ORIGINS", "*")

if cors_origins == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# UTILIDADES
# =========================

def to_float(value):
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(raw_password: str, stored_password: str) -> bool:
    if not stored_password:
        return False

    # Contraseñas nuevas con bcrypt
    if stored_password.startswith("$2a$") or stored_password.startswith("$2b$") or stored_password.startswith("$2y$"):
        return bcrypt.checkpw(
            raw_password.encode("utf-8"),
            stored_password.encode("utf-8")
        )

    # Compatibilidad temporal con contraseñas antiguas en SHA-256 o texto plano
    old_sha256 = hashlib.sha256(raw_password.encode("utf-8")).hexdigest()
    return stored_password in {raw_password, old_sha256}


def bool_filter_to_int(value: Optional[bool]):
    if value is True:
        return 1

    return None


def rol_to_dict(rol: models.Rol):
    return {
        "idRol": rol.idRol,
        "nombre": rol.nombre,
        "rol": rol.nombre,  # Algunas pantallas usan rol.rol
        "descripcion": rol.descripcion or "",
    }


def usuario_to_dict(usuario: models.Usuario):
    return {
        "idUsuario": usuario.idUsuario,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "username": usuario.username,
        "idRol": usuario.idRol,
        "nombreRol": usuario.rol.nombre if usuario.rol else "Sin rol",
        "estatus": usuario.estatus,
    }


def categoria_to_dict(categoria: models.Categoria):
    return {
        "idCategoria": categoria.idCategoria,
        "nombre": categoria.nombre,
        "descripcion": categoria.descripcion or "",
        "estatus": categoria.estatus,
    }


def producto_to_dict(producto: models.Producto):
    precio = to_float(producto.precio)
    return {
        "idProducto": producto.idProducto,
        "codigo": producto.codigo,
        "nombre": producto.nombre,
        "descripcion": producto.descripcion or "",
        "precio": precio,
        "precioVenta": precio,
        "precioCompra": precio,
        "stock": producto.stockActual,
        "stockActual": producto.stockActual,
        "stockMinimo": producto.stockMinimo,
        "idCategoria": producto.idCategoria,
        "categoria": producto.categoria.nombre if producto.categoria else "",
        "estatus": producto.estatus,
    }


def proveedor_to_dict(proveedor: models.Proveedor):
    return {
        "idProveedor": proveedor.idProveedor,
        "nombre": proveedor.nombre,
        "RFC": proveedor.RFC,
        "direccion": proveedor.direccion or "",
        "ciudad": proveedor.ciudad or "",
        "estado": proveedor.estado or "",
        "telefono": proveedor.telefono or "",
        "correo": proveedor.correo or "",
        "estatus": proveedor.estatus,
    }


def cliente_to_dict(cliente: models.Cliente):
    return {
        "idCliente": cliente.idCliente,
        "nombre": cliente.nombre,
        "telefono": cliente.telefono or "",
        "email": cliente.email or "",
        "direccion": cliente.direccion or "",
        "estatus": cliente.estatus,
    }


def forma_pago_to_dict(fp: models.FormaPago):
    return {
        "idFormaPago": fp.idFormaPago,
        "tipo": fp.tipo,
        "estatus": fp.estatus,
    }


def venta_to_dict(venta: models.Venta, include_detalles: bool = False):
    data = {
        "idVenta": venta.idVenta,
        "idUsuario": venta.idUsuario,
        "nombreUsuario": venta.usuario.username if venta.usuario else "",
        "idFormaPago": venta.idFormaPago,
        "formaPago": venta.forma_pago.tipo if venta.forma_pago else "",
        "fechaVenta": venta.fechaVenta.isoformat() if venta.fechaVenta else "",
        "subtotal": to_float(venta.subtotal),
        "nombreCliente": "Cliente General",
    }
    if include_detalles:
        data["detalles"] = [
            {
                "idProducto": d.idProducto,
                "codigoProducto": d.producto.codigo if d.producto else "",
                "nombreProducto": d.producto.nombre if d.producto else "",
                "cantidad": d.cantidad,
                "precio": to_float(d.precio),
                "stockDisponible": d.producto.stockActual if d.producto else 0,
            }
            for d in venta.detalles
        ]
    return data


def compra_to_dict(compra: models.Compra, include_detalles: bool = False):
    data = {
        "idCompra": compra.idCompra,
        "idProveedor": compra.idProveedor,
        "nombreProveedor": compra.proveedor.nombre if compra.proveedor else "",
        "fechaCompra": compra.fechaCompra.isoformat() if compra.fechaCompra else "",
        "estatus": compra.estatus,
        "subtotal": to_float(compra.subtotal),
    }
    if include_detalles:
        data["detalles"] = [
            {
                "idProducto": d.idProducto,
                "codigoProducto": d.producto.codigo if d.producto else "",
                "nombreProducto": d.producto.nombre if d.producto else "",
                "cantidad": d.cantidad,
                "precioCompra": to_float(d.precioCompra),
            }
            for d in compra.detalles
        ]
    return data


def movimiento_to_dict(m: models.InventarioMovimiento):
    return {
        "idMovimiento": m.idMovimiento,
        "tipo": m.tipo,
        "tipoMovimiento": m.tipoMovimiento,
        "cantidad": m.cantidad,
        "fecha": m.fecha.isoformat() if m.fecha else "",
        "usuario": m.usuario or "Sistema",
        "referencia": m.referencia or "",
        "precioUnitario": to_float(m.precioUnitario) if m.precioUnitario is not None else None,
        "total": to_float(m.total) if m.total is not None else None,
        "comentario": m.comentario or "",
    }


def crear_movimiento(
    db: Session,
    producto: models.Producto,
    tipo: str,
    tipo_movimiento: str,
    cantidad: int,
    usuario: str,
    referencia: str,
    precio_unitario: Optional[float] = None,
    comentario: Optional[str] = None,
):
    total = None
    if precio_unitario is not None:
        total = Decimal(str(precio_unitario)) * Decimal(str(cantidad))

    movimiento = models.InventarioMovimiento(
        idProducto=producto.idProducto,
        tipo=tipo,
        tipoMovimiento=tipo_movimiento,
        cantidad=abs(int(cantidad)),
        usuario=usuario,
        referencia=referencia,
        precioUnitario=precio_unitario,
        total=total,
        comentario=comentario,
    )
    db.add(movimiento)


def seed_data():
    db = SessionLocal()
    try:
        if db.query(models.Rol).count() == 0:
            admin = models.Rol(nombre="Administrador", descripcion="Acceso completo al sistema")
            vendedor = models.Rol(nombre="Vendedor", descripcion="Ventas y consultas básicas")
            db.add_all([admin, vendedor])
            db.flush()

        admin_role = db.query(models.Rol).filter(models.Rol.nombre == "Administrador").first()
        if db.query(models.Usuario).count() == 0 and admin_role:
            username = os.getenv("ADMIN_USERNAME", "admin")
            password = os.getenv("ADMIN_PASSWORD", "admin123")
            db.add(
                models.Usuario(
                    nombre="Administrador",
                    apellido="General",
                    username=username,
                    password=hash_password(password),
                    idRol=admin_role.idRol,
                    estatus=1,
                )
            )

        if db.query(models.FormaPago).count() == 0:
            db.add_all(
                [
                    models.FormaPago(idFormaPago=1, tipo="Efectivo", estatus=1),
                    models.FormaPago(idFormaPago=2, tipo="Tarjeta", estatus=1),
                    models.FormaPago(idFormaPago=3, tipo="Transferencia", estatus=1),
                ]
            )

        if db.query(models.Categoria).count() == 0:
            db.add_all(
                [
                    models.Categoria(nombre="Medicamentos", descripcion="Medicamentos generales", estatus=1),
                    models.Categoria(nombre="Cuidado personal", descripcion="Productos de higiene y cuidado", estatus=1),
                    models.Categoria(nombre="Material médico", descripcion="Material de curación y primeros auxilios", estatus=1),
                ]
            )

        if db.query(models.ConfiguracionImpresion).count() == 0:
            db.add(models.ConfiguracionImpresion(id=1))

        if db.query(models.ConfiguracionSeguridad).count() == 0:
            db.add(models.ConfiguracionSeguridad(id=1))

        db.commit()
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_data()


# =========================
# GENERAL
# =========================

@app.get("/")
def inicio():
    return {"mensaje": "Backend Farmacia funcionando correctamente"}

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "farmacia-api"
    }


# =========================
# LOGIN
# =========================

@app.post("/login/")
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    usuario = (
        db.query(models.Usuario)
        .options(joinedload(models.Usuario.rol))
        .filter(models.Usuario.username == data.username)
        .first()
    )

    if not usuario or usuario.estatus != 1 or not verify_password(data.password, usuario.password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

        # Si el usuario tenía contraseña antigua, la migramos automáticamente a bcrypt
    if not usuario.password.startswith(("$2a$", "$2b$", "$2y$")):
        usuario.password = hash_password(data.password)
        db.commit()

    return usuario_to_dict(usuario)


# =========================
# ROLES
# =========================

@app.get("/roles/")
def listar_roles(db: Session = Depends(get_db)):
    roles = db.query(models.Rol).order_by(models.Rol.idRol).all()
    return [rol_to_dict(r) for r in roles]


@app.post("/roles/", status_code=201)
def crear_rol(data: schemas.RolCreate, db: Session = Depends(get_db)):
    existe = db.query(models.Rol).filter(models.Rol.nombre == data.nombre).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un rol con ese nombre")
    rol = models.Rol(nombre=data.nombre, descripcion=data.descripcion)
    db.add(rol)
    db.commit()
    db.refresh(rol)
    return rol_to_dict(rol)


@app.put("/roles/{idRol}")
def actualizar_rol(idRol: int, data: schemas.RolUpdate, db: Session = Depends(get_db)):
    rol = db.get(models.Rol, idRol)
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    rol.nombre = data.nombre
    rol.descripcion = data.descripcion
    db.commit()
    db.refresh(rol)
    return rol_to_dict(rol)


@app.delete("/roles/{idRol}")
def eliminar_rol(idRol: int, db: Session = Depends(get_db)):
    rol = db.get(models.Rol, idRol)
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    usado = db.query(models.Usuario).filter(models.Usuario.idRol == idRol).first()
    if usado:
        raise HTTPException(status_code=400, detail="No se puede eliminar un rol asignado a usuarios")
    db.delete(rol)
    db.commit()
    return {"mensaje": "Rol eliminado"}


# =========================
# USUARIOS
# =========================

@app.get("/usuarios/")
def listar_usuarios(
    soloActivos: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Usuario).options(joinedload(models.Usuario.rol))
    estado = bool_filter_to_int(soloActivos)
    if estado is not None:
        query = query.filter(models.Usuario.estatus == estado)
    usuarios = query.order_by(models.Usuario.idUsuario).all()
    return [usuario_to_dict(u) for u in usuarios]


@app.post("/usuarios/", status_code=201)
def crear_usuario(data: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    if not data.password:
        raise HTTPException(status_code=400, detail="La contraseña es obligatoria")
    if db.query(models.Usuario).filter(models.Usuario.username == data.username).first():
        raise HTTPException(status_code=400, detail="El username ya existe")
    if not db.get(models.Rol, data.idRol):
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    usuario = models.Usuario(
        nombre=data.nombre,
        apellido=data.apellido,
        username=data.username,
        password=hash_password(data.password),
        idRol=data.idRol,
        estatus=data.estatus,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario_to_dict(usuario)


@app.put("/usuarios/{idUsuario}")
def actualizar_usuario(idUsuario: int, data: schemas.UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = db.get(models.Usuario, idUsuario)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not db.get(models.Rol, data.idRol):
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    usuario.nombre = data.nombre
    usuario.apellido = data.apellido
    usuario.idRol = data.idRol
    usuario.estatus = data.estatus
    if data.password:
        usuario.password = hash_password(data.password)

    db.commit()
    db.refresh(usuario)
    return usuario_to_dict(usuario)


@app.delete("/usuarios/{idUsuario}")
def eliminar_usuario(idUsuario: int, db: Session = Depends(get_db)):
    usuario = db.get(models.Usuario, idUsuario)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.estatus = 0
    db.commit()
    return {"mensaje": "Usuario deshabilitado"}


# =========================
# CATEGORÍAS
# =========================

@app.get("/categorias/")
def listar_categorias(db: Session = Depends(get_db)):
    categorias = db.query(models.Categoria).order_by(models.Categoria.nombre).all()
    return [categoria_to_dict(c) for c in categorias]


@app.post("/categorias/", status_code=201)
def crear_categoria(data: schemas.CategoriaCreate, db: Session = Depends(get_db)):
    categoria = models.Categoria(nombre=data.nombre, descripcion=data.descripcion, estatus=1)
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria_to_dict(categoria)


@app.put("/categorias/{idCategoria}")
def actualizar_categoria(idCategoria: int, data: schemas.CategoriaUpdate, db: Session = Depends(get_db)):
    categoria = db.get(models.Categoria, idCategoria)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    categoria.nombre = data.nombre
    categoria.descripcion = data.descripcion
    db.commit()
    db.refresh(categoria)
    return categoria_to_dict(categoria)


@app.delete("/categorias/{idCategoria}")
def eliminar_categoria(idCategoria: int, db: Session = Depends(get_db)):
    categoria = db.get(models.Categoria, idCategoria)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    categoria.estatus = 0
    db.commit()
    return {"mensaje": "Categoría deshabilitada"}


# =========================
# PRODUCTOS
# =========================

@app.get("/productos/")
def listar_productos(
    soloActivos: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Producto).options(joinedload(models.Producto.categoria))
    estado = bool_filter_to_int(soloActivos)
    if estado is not None:
        query = query.filter(models.Producto.estatus == estado)
    productos = query.order_by(models.Producto.nombre).all()
    return [producto_to_dict(p) for p in productos]


@app.post("/productos/", status_code=201)
def crear_producto(data: schemas.ProductoCreate, db: Session = Depends(get_db)):
    if db.query(models.Producto).filter(models.Producto.codigo == data.codigo).first():
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese código")
    if not db.get(models.Categoria, data.idCategoria):
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    producto = models.Producto(**data.model_dump())
    db.add(producto)
    db.flush()

    crear_movimiento(
        db,
        producto,
        tipo="Ajuste Manual",
        tipo_movimiento="entrada" if data.stockActual > 0 else "ajuste",
        cantidad=data.stockActual,
        usuario="Sistema",
        referencia="Alta de producto",
        precio_unitario=data.precio,
        comentario="Stock inicial",
    )

    db.commit()
    db.refresh(producto)
    return producto_to_dict(producto)


@app.put("/productos/{idProducto}")
def actualizar_producto(idProducto: int, data: schemas.ProductoUpdate, db: Session = Depends(get_db)):
    producto = db.get(models.Producto, idProducto)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if not db.get(models.Categoria, data.idCategoria):
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    stock_anterior = producto.stockActual

    producto.nombre = data.nombre
    producto.descripcion = data.descripcion
    producto.precio = data.precio
    producto.stockMinimo = data.stockMinimo
    producto.stockActual = data.stockActual
    producto.idCategoria = data.idCategoria
    producto.estatus = data.estatus

    diferencia = data.stockActual - stock_anterior
    if diferencia != 0:
        crear_movimiento(
            db,
            producto,
            tipo="Ajuste Manual",
            tipo_movimiento="entrada" if diferencia > 0 else "salida",
            cantidad=abs(diferencia),
            usuario="Sistema",
            referencia="Edición de producto",
            precio_unitario=data.precio,
            comentario="Cambio de stock desde edición",
        )

    db.commit()
    db.refresh(producto)
    return producto_to_dict(producto)


@app.delete("/productos/{idProducto}")
def eliminar_producto(idProducto: int, db: Session = Depends(get_db)):
    producto = db.get(models.Producto, idProducto)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if producto.estatus == 1:
        producto.estatus = 0
        db.commit()
        return {"mensaje": "Producto dado de baja"}
    else:
        db.delete(producto)
        db.commit()
        return {"mensaje": "Producto eliminado permanentemente"}


@app.post("/productos/{idProducto}/ajustar-stock")
def ajustar_stock(idProducto: int, data: schemas.AjusteStockRequest, db: Session = Depends(get_db)):
    producto = db.get(models.Producto, idProducto)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if data.nuevaCantidad < 0:
        raise HTTPException(status_code=400, detail="La cantidad no puede ser negativa")

    anterior = producto.stockActual
    diferencia = data.nuevaCantidad - anterior
    producto.stockActual = data.nuevaCantidad

    crear_movimiento(
        db,
        producto,
        tipo="Ajuste Manual",
        tipo_movimiento="entrada" if diferencia >= 0 else "salida",
        cantidad=abs(diferencia),
        usuario="Sistema",
        referencia="Ajuste manual",
        precio_unitario=to_float(producto.precio),
        comentario=data.comentario,
    )

    db.commit()
    db.refresh(producto)
    return producto_to_dict(producto)


@app.get("/productos/{idProducto}/historial")
def historial_producto(idProducto: int, db: Session = Depends(get_db)):
    producto = db.get(models.Producto, idProducto)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    movimientos = (
        db.query(models.InventarioMovimiento)
        .filter(models.InventarioMovimiento.idProducto == idProducto)
        .order_by(models.InventarioMovimiento.fecha.desc())
        .all()
    )
    return {"historial": [movimiento_to_dict(m) for m in movimientos]}


@app.get("/productos/{idProducto}/estadisticas")
def estadisticas_producto(idProducto: int, db: Session = Depends(get_db)):
    producto = db.get(models.Producto, idProducto)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    total_comprado = (
        db.query(func.coalesce(func.sum(models.DetalleCompra.cantidad), 0))
        .join(models.Compra)
        .filter(models.DetalleCompra.idProducto == idProducto, models.Compra.estatus == "Realizada")
        .scalar()
    )
    total_vendido = (
        db.query(func.coalesce(func.sum(models.DetalleVenta.cantidad), 0))
        .filter(models.DetalleVenta.idProducto == idProducto)
        .scalar()
    )
    ingresos = (
        db.query(func.coalesce(func.sum(models.DetalleVenta.cantidad * models.DetalleVenta.precio), 0))
        .filter(models.DetalleVenta.idProducto == idProducto)
        .scalar()
    )
    gastos = (
        db.query(func.coalesce(func.sum(models.DetalleCompra.cantidad * models.DetalleCompra.precioCompra), 0))
        .join(models.Compra)
        .filter(models.DetalleCompra.idProducto == idProducto, models.Compra.estatus == "Realizada")
        .scalar()
    )

    return {
        "estadisticas": {
            "total_comprado": int(total_comprado or 0),
            "total_vendido": int(total_vendido or 0),
            "ingresos_por_ventas": to_float(ingresos),
            "gastos_por_compras": to_float(gastos),
            "margen_bruto": to_float(ingresos) - to_float(gastos),
        }
    }


# =========================
# PROVEEDORES
# =========================

@app.get("/proveedores/")
def listar_proveedores(
    soloActivos: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Proveedor)
    estado = bool_filter_to_int(soloActivos)
    if estado is not None:
        query = query.filter(models.Proveedor.estatus == estado)
    proveedores = query.order_by(models.Proveedor.nombre).all()
    return [proveedor_to_dict(p) for p in proveedores]


@app.post("/proveedores/", status_code=201)
def crear_proveedor(data: schemas.ProveedorCreate, db: Session = Depends(get_db)):
    if db.query(models.Proveedor).filter(models.Proveedor.RFC == data.RFC).first():
        raise HTTPException(status_code=400, detail="Ya existe un proveedor con ese RFC")
    proveedor = models.Proveedor(**data.model_dump())
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return proveedor_to_dict(proveedor)


@app.put("/proveedores/{idProveedor}")
def actualizar_proveedor(idProveedor: int, data: schemas.ProveedorUpdate, db: Session = Depends(get_db)):
    proveedor = db.get(models.Proveedor, idProveedor)
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    for key, value in data.model_dump().items():
        setattr(proveedor, key, value)

    db.commit()
    db.refresh(proveedor)
    return proveedor_to_dict(proveedor)


@app.delete("/proveedores/{idProveedor}")
def eliminar_proveedor(idProveedor: int, db: Session = Depends(get_db)):
    proveedor = db.get(models.Proveedor, idProveedor)
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    proveedor.estatus = 0
    db.commit()
    return {"mensaje": "Proveedor dado de baja"}


# =========================
# CLIENTES
# =========================

@app.get("/clientes/")
def listar_clientes(
    soloActivos: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Cliente)
    estado = bool_filter_to_int(soloActivos)
    if estado is not None:
        query = query.filter(models.Cliente.estatus == estado)
    clientes = query.order_by(models.Cliente.nombre).all()
    return [cliente_to_dict(c) for c in clientes]


@app.post("/clientes/", status_code=201)
def crear_cliente(data: schemas.ClienteCreate, db: Session = Depends(get_db)):
    cliente = models.Cliente(**data.model_dump())
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente_to_dict(cliente)


@app.put("/clientes/{idCliente}")
def actualizar_cliente(idCliente: int, data: schemas.ClienteUpdate, db: Session = Depends(get_db)):
    cliente = db.get(models.Cliente, idCliente)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for key, value in data.model_dump().items():
        setattr(cliente, key, value)
    db.commit()
    db.refresh(cliente)
    return cliente_to_dict(cliente)


@app.delete("/clientes/{idCliente}")
def eliminar_cliente(idCliente: int, db: Session = Depends(get_db)):
    cliente = db.get(models.Cliente, idCliente)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    cliente.estatus = 0
    db.commit()
    return {"mensaje": "Cliente dado de baja"}


# =========================
# FORMAS DE PAGO
# =========================

@app.get("/formasPago/")
def listar_formas_pago(db: Session = Depends(get_db)):
    formas = db.query(models.FormaPago).filter(models.FormaPago.estatus == 1).order_by(models.FormaPago.idFormaPago).all()
    return [forma_pago_to_dict(fp) for fp in formas]


# =========================
# VENTAS
# =========================

@app.get("/ventas/")
def listar_ventas(
    idUsuario: Optional[int] = None,
    idFormaPago: Optional[int] = None,
    fechaInicio: Optional[date] = None,
    fechaFin: Optional[date] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.Venta)
        .options(joinedload(models.Venta.usuario), joinedload(models.Venta.forma_pago))
    )
    if idUsuario:
        query = query.filter(models.Venta.idUsuario == idUsuario)
    if idFormaPago:
        query = query.filter(models.Venta.idFormaPago == idFormaPago)
    if fechaInicio:
        query = query.filter(models.Venta.fechaVenta >= fechaInicio)
    if fechaFin:
        query = query.filter(models.Venta.fechaVenta <= fechaFin)

    ventas = query.order_by(models.Venta.fechaVenta.desc(), models.Venta.idVenta.desc()).all()
    return [venta_to_dict(v) for v in ventas]


@app.get("/ventas/{idVenta}")
def obtener_venta(idVenta: int, db: Session = Depends(get_db)):
    venta = (
        db.query(models.Venta)
        .options(
            joinedload(models.Venta.usuario),
            joinedload(models.Venta.forma_pago),
            joinedload(models.Venta.detalles).joinedload(models.DetalleVenta.producto),
        )
        .filter(models.Venta.idVenta == idVenta)
        .first()
    )
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta_to_dict(venta, include_detalles=True)


@app.post("/ventas/", status_code=201)
def crear_venta(data: schemas.VentaCreate, db: Session = Depends(get_db)):
    usuario = db.get(models.Usuario, data.idUsuario)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not db.get(models.FormaPago, data.idFormaPago):
        raise HTTPException(status_code=404, detail="Forma de pago no encontrada")
    if not data.detalles:
        raise HTTPException(status_code=400, detail="La venta debe tener productos")

    subtotal = Decimal("0.00")
    productos = {}

    for detalle in data.detalles:
        producto = db.get(models.Producto, detalle.idProducto)
        if not producto or producto.estatus != 1:
            raise HTTPException(status_code=404, detail=f"Producto {detalle.idProducto} no encontrado o inactivo")
        if detalle.cantidad <= 0:
            raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")
        if producto.stockActual < detalle.cantidad:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {producto.nombre}")
        productos[detalle.idProducto] = producto
        subtotal += Decimal(str(detalle.cantidad)) * Decimal(str(detalle.precio))

    venta = models.Venta(
        idUsuario=data.idUsuario,
        idFormaPago=data.idFormaPago,
        fechaVenta=data.fechaVenta,
        subtotal=subtotal,
    )
    db.add(venta)
    db.flush()

    for detalle in data.detalles:
        producto = productos[detalle.idProducto]
        producto.stockActual -= detalle.cantidad
        db.add(
            models.DetalleVenta(
                idVenta=venta.idVenta,
                idProducto=detalle.idProducto,
                cantidad=detalle.cantidad,
                precio=detalle.precio,
            )
        )
        crear_movimiento(
            db,
            producto,
            tipo="Venta",
            tipo_movimiento="salida",
            cantidad=detalle.cantidad,
            usuario=usuario.username,
            referencia=f"Venta #{venta.idVenta}",
            precio_unitario=detalle.precio,
            comentario="Salida por venta",
        )

    db.commit()
    venta = (
        db.query(models.Venta)
        .options(joinedload(models.Venta.usuario), joinedload(models.Venta.forma_pago))
        .filter(models.Venta.idVenta == venta.idVenta)
        .first()
    )
    return venta_to_dict(venta)


@app.put("/ventas/{idVenta}")
def actualizar_venta(idVenta: int, data: schemas.VentaCreate, db: Session = Depends(get_db)):
    venta = (
        db.query(models.Venta)
        .options(joinedload(models.Venta.detalles).joinedload(models.DetalleVenta.producto))
        .filter(models.Venta.idVenta == idVenta)
        .first()
    )
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    # Revertir stock anterior
    for d in venta.detalles:
        if d.producto:
            d.producto.stockActual += d.cantidad

    venta.detalles.clear()
    db.flush()

    subtotal = Decimal("0.00")
    for d in data.detalles:
        producto = db.get(models.Producto, d.idProducto)
        if not producto or producto.stockActual < d.cantidad:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para producto {d.idProducto}")
        producto.stockActual -= d.cantidad
        subtotal += Decimal(str(d.cantidad)) * Decimal(str(d.precio))
        venta.detalles.append(models.DetalleVenta(idProducto=d.idProducto, cantidad=d.cantidad, precio=d.precio))

    venta.idUsuario = data.idUsuario
    venta.idFormaPago = data.idFormaPago
    venta.fechaVenta = data.fechaVenta
    venta.subtotal = subtotal
    db.commit()
    return obtener_venta(idVenta, db)


# =========================
# COMPRAS
# =========================

@app.get("/compras/")
def listar_compras(
    idProveedor: Optional[int] = None,
    fechaInicio: Optional[date] = None,
    fechaFin: Optional[date] = None,
    estatus: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Compra).options(joinedload(models.Compra.proveedor))
    if idProveedor:
        query = query.filter(models.Compra.idProveedor == idProveedor)
    if fechaInicio:
        query = query.filter(models.Compra.fechaCompra >= fechaInicio)
    if fechaFin:
        query = query.filter(models.Compra.fechaCompra <= fechaFin)
    if estatus:
        query = query.filter(models.Compra.estatus == estatus)

    compras = query.order_by(models.Compra.fechaCompra.desc(), models.Compra.idCompra.desc()).all()
    return [compra_to_dict(c) for c in compras]


@app.get("/compras/{idCompra}")
def obtener_compra(idCompra: int, db: Session = Depends(get_db)):
    compra = (
        db.query(models.Compra)
        .options(
            joinedload(models.Compra.proveedor),
            joinedload(models.Compra.detalles).joinedload(models.DetalleCompra.producto),
        )
        .filter(models.Compra.idCompra == idCompra)
        .first()
    )
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    return compra_to_dict(compra, include_detalles=True)


@app.post("/compras/", status_code=201)
def crear_compra(data: schemas.CompraCreate, db: Session = Depends(get_db)):
    proveedor = db.get(models.Proveedor, data.idProveedor)
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    if not data.detalles:
        raise HTTPException(status_code=400, detail="La compra debe tener productos")

    subtotal = Decimal("0.00")
    productos = {}

    for detalle in data.detalles:
        producto = db.get(models.Producto, detalle.idProducto)
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto {detalle.idProducto} no encontrado")
        if detalle.cantidad <= 0:
            raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")
        productos[detalle.idProducto] = producto
        subtotal += Decimal(str(detalle.cantidad)) * Decimal(str(detalle.precioCompra))

    compra = models.Compra(
        idProveedor=data.idProveedor,
        fechaCompra=data.fechaCompra,
        estatus=data.estatus,
        subtotal=subtotal,
    )
    db.add(compra)
    db.flush()

    for detalle in data.detalles:
        producto = productos[detalle.idProducto]
        db.add(
            models.DetalleCompra(
                idCompra=compra.idCompra,
                idProducto=detalle.idProducto,
                cantidad=detalle.cantidad,
                precioCompra=detalle.precioCompra,
            )
        )
        if data.estatus == "Realizada":
            producto.stockActual += detalle.cantidad
            crear_movimiento(
                db,
                producto,
                tipo="Compra",
                tipo_movimiento="entrada",
                cantidad=detalle.cantidad,
                usuario="Sistema",
                referencia=f"Compra #{compra.idCompra}",
                precio_unitario=detalle.precioCompra,
                comentario="Entrada por compra",
            )

    db.commit()
    compra = (
        db.query(models.Compra)
        .options(joinedload(models.Compra.proveedor))
        .filter(models.Compra.idCompra == compra.idCompra)
        .first()
    )
    return compra_to_dict(compra)


@app.put("/compras/{idCompra}")
def actualizar_compra(idCompra: int, data: schemas.CompraCreate, db: Session = Depends(get_db)):
    compra = (
        db.query(models.Compra)
        .options(joinedload(models.Compra.detalles).joinedload(models.DetalleCompra.producto))
        .filter(models.Compra.idCompra == idCompra)
        .first()
    )
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    # Revertir stock si antes estaba realizada
    if compra.estatus == "Realizada":
        for d in compra.detalles:
            if d.producto:
                d.producto.stockActual -= d.cantidad

    compra.detalles.clear()
    db.flush()

    subtotal = Decimal("0.00")
    for d in data.detalles:
        producto = db.get(models.Producto, d.idProducto)
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto {d.idProducto} no encontrado")
        subtotal += Decimal(str(d.cantidad)) * Decimal(str(d.precioCompra))
        compra.detalles.append(models.DetalleCompra(idProducto=d.idProducto, cantidad=d.cantidad, precioCompra=d.precioCompra))
        if data.estatus == "Realizada":
            producto.stockActual += d.cantidad

    compra.idProveedor = data.idProveedor
    compra.fechaCompra = data.fechaCompra
    compra.estatus = data.estatus
    compra.subtotal = subtotal
    db.commit()
    return obtener_compra(idCompra, db)


# =========================
# CONFIGURACIÓN
# =========================

@app.get("/configuracion/impresion")
def obtener_config_impresion(db: Session = Depends(get_db)):
    config = db.get(models.ConfiguracionImpresion, 1)
    if not config:
        config = models.ConfiguracionImpresion(id=1)
        db.add(config)
        db.commit()
        db.refresh(config)
    return {
        "nombre_farmacia": config.nombre_farmacia,
        "direccion": config.direccion,
        "telefono": config.telefono,
        "rfc": config.rfc,
        "incluir_logo_ticket": config.incluir_logo_ticket,
        "incluir_rfc_ticket": config.incluir_rfc_ticket,
        "incluir_direccion_ticket": config.incluir_direccion_ticket,
        "mensaje_pie_ticket": config.mensaje_pie_ticket,
        "tamano_etiqueta": config.tamano_etiqueta,
        "incluir_codigo_barras": config.incluir_codigo_barras,
        "incluir_precio_etiqueta": config.incluir_precio_etiqueta,
        "incluir_logo_reporte": config.incluir_logo_reporte,
        "orientacion_reporte": config.orientacion_reporte,
        "tamano_papel_reporte": config.tamano_papel_reporte,
    }


@app.put("/configuracion/impresion")
def guardar_config_impresion(data: schemas.ConfiguracionImpresionSchema, db: Session = Depends(get_db)):
    config = db.get(models.ConfiguracionImpresion, 1)
    if not config:
        config = models.ConfiguracionImpresion(id=1)
        db.add(config)

    for key, value in data.model_dump().items():
        setattr(config, key, value)

    db.commit()
    return obtener_config_impresion(db)


@app.get("/seguridad/configuracion")
def obtener_config_seguridad(db: Session = Depends(get_db)):
    config = db.get(models.ConfiguracionSeguridad, 1)
    if not config:
        config = models.ConfiguracionSeguridad(id=1)
        db.add(config)
        db.commit()
        db.refresh(config)
    return {
        "longitud_minima_password": config.longitud_minima_password,
        "requerir_mayusculas": config.requerir_mayusculas,
        "requerir_minusculas": config.requerir_minusculas,
        "requerir_numeros": config.requerir_numeros,
        "requerir_caracteres_especiales": config.requerir_caracteres_especiales,
        "dias_expiracion_password": config.dias_expiracion_password,
        "tiempo_sesion_minutos": config.tiempo_sesion_minutos,
        "cerrar_sesion_inactividad": config.cerrar_sesion_inactividad,
        "minutos_inactividad": config.minutos_inactividad,
        "permitir_sesiones_multiples": config.permitir_sesiones_multiples,
        "intentos_login_permitidos": config.intentos_login_permitidos,
        "minutos_bloqueo_cuenta": config.minutos_bloqueo_cuenta,
        "requerir_cambio_password_primer_login": config.requerir_cambio_password_primer_login,
        "registrar_acciones_usuarios": config.registrar_acciones_usuarios,
        "registrar_cambios_datos": config.registrar_cambios_datos,
        "dias_retencion_logs": config.dias_retencion_logs,
    }


@app.put("/seguridad/configuracion")
def guardar_config_seguridad(data: schemas.ConfiguracionSeguridadSchema, db: Session = Depends(get_db)):
    config = db.get(models.ConfiguracionSeguridad, 1)
    if not config:
        config = models.ConfiguracionSeguridad(id=1)
        db.add(config)

    for key, value in data.model_dump().items():
        setattr(config, key, value)

    db.commit()
    return obtener_config_seguridad(db)


# =========================
# EXPORTAR Y BACKUP
# =========================

def csv_response(filename: str, rows: list[dict]):
    output = io.StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    else:
        output.write("sin_datos\n")

    output.seek(0)
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers=headers)


@app.get("/exportar/{tipo}")
def exportar_datos(tipo: str, db: Session = Depends(get_db)):
    fecha = datetime.now().date().isoformat()

    if tipo == "productos":
        rows = [producto_to_dict(p) for p in db.query(models.Producto).options(joinedload(models.Producto.categoria)).all()]
    elif tipo == "ventas":
        rows = [venta_to_dict(v) for v in db.query(models.Venta).options(joinedload(models.Venta.usuario), joinedload(models.Venta.forma_pago)).all()]
    elif tipo == "compras":
        rows = [compra_to_dict(c) for c in db.query(models.Compra).options(joinedload(models.Compra.proveedor)).all()]
    elif tipo == "clientes":
        rows = [cliente_to_dict(c) for c in db.query(models.Cliente).all()]
    elif tipo == "proveedores":
        rows = [proveedor_to_dict(p) for p in db.query(models.Proveedor).all()]
    elif tipo == "usuarios":
        rows = [usuario_to_dict(u) for u in db.query(models.Usuario).options(joinedload(models.Usuario.rol)).all()]
    else:
        raise HTTPException(status_code=404, detail="Tipo de exportación no válido")

    return csv_response(f"{tipo}_{fecha}.csv", rows)


@app.post("/backup/crear")
def crear_backup(db: Session = Depends(get_db)):
    # Backup simple en texto SQL-like para cumplir con la descarga desde la app.
    # Para producción, usa mysqldump.
    partes = [
        f"-- Backup farmacia generado el {datetime.now().isoformat()}",
        "-- Este archivo es una exportación básica generada por la API.",
        "",
    ]

    tablas = {
        "roles": [rol_to_dict(r) for r in db.query(models.Rol).all()],
        "usuarios": [usuario_to_dict(u) for u in db.query(models.Usuario).options(joinedload(models.Usuario.rol)).all()],
        "categorias": [categoria_to_dict(c) for c in db.query(models.Categoria).all()],
        "productos": [producto_to_dict(p) for p in db.query(models.Producto).options(joinedload(models.Producto.categoria)).all()],
        "proveedores": [proveedor_to_dict(p) for p in db.query(models.Proveedor).all()],
        "clientes": [cliente_to_dict(c) for c in db.query(models.Cliente).all()],
        "formas_pago": [forma_pago_to_dict(fp) for fp in db.query(models.FormaPago).all()],
        "ventas": [venta_to_dict(v) for v in db.query(models.Venta).options(joinedload(models.Venta.usuario), joinedload(models.Venta.forma_pago)).all()],
        "compras": [compra_to_dict(c) for c in db.query(models.Compra).options(joinedload(models.Compra.proveedor)).all()],
    }

    for tabla, rows in tablas.items():
        partes.append(f"-- Tabla: {tabla}")
        for row in rows:
            partes.append(f"-- {row}")
        partes.append("")

    contenido = "\n".join(partes)
    headers = {"Content-Disposition": 'attachment; filename="backup_farmacia.sql"'}
    return PlainTextResponse(contenido, media_type="application/sql", headers=headers)
