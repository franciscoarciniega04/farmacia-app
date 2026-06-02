# Backend Farmacia - FastAPI + MySQL

Este backend fue armado para coincidir con los nombres de campos que usa el frontend de Expo/React Native.

## 1. Crear base de datos

En MySQL Workbench ejecuta:

```sql
CREATE DATABASE farmacia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. Crear entorno virtual

En la carpeta del backend:

```powershell
python -m venv .venv
```

Si PowerShell bloquea la activación, usa CMD:

```cmd
.venv\Scripts\activate.bat
```

O en PowerShell sin activar:

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## 3. Instalar dependencias

```powershell
pip install -r requirements.txt
```

## 4. Configurar `.env`

Copia `.env.example` como `.env` y cambia la contraseña de MySQL:

```env
DB_USER=root
DB_PASSWORD=TU_CONTRASENA_MYSQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=farmacia_db
```

## 5. Ejecutar backend

Para probar en la misma PC:

```powershell
uvicorn main:app --reload
```

Para que Expo en el celular pueda conectarse:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 6. Abrir documentación

```text
http://127.0.0.1:8000/docs
```

## 7. Usuario inicial

Al iniciar por primera vez, se crea automáticamente:

```text
Usuario: admin
Contraseña: admin123
```

Puedes cambiarlo en `.env` antes de iniciar:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## 8. Endpoints principales

- `POST /login/`
- `GET/POST/PUT/DELETE /usuarios/`
- `GET/POST/PUT/DELETE /roles/`
- `GET/POST/PUT/DELETE /productos/`
- `POST /productos/{idProducto}/ajustar-stock`
- `GET /productos/{idProducto}/historial`
- `GET /productos/{idProducto}/estadisticas`
- `GET/POST/PUT/DELETE /categorias/`
- `GET/POST/PUT/DELETE /proveedores/`
- `GET/POST/PUT /ventas/`
- `GET/POST/PUT /compras/`
- `GET/POST/PUT/DELETE /clientes/`
- `GET /formasPago/`
- `GET /exportar/{tipo}`
- `POST /backup/crear`
- `GET/PUT /configuracion/impresion`
- `GET/PUT /seguridad/configuracion`
