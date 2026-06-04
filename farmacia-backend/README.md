# Farmacia Backend

Backend para una aplicación de farmacia desarrollado con **FastAPI**, **SQLAlchemy** y **MySQL**.
El proyecto está preparado para ejecutarse localmente usando **Docker Compose**, incluyendo el backend y la base de datos MySQL en contenedores.

## Tecnologías utilizadas

* Python
* FastAPI
* Uvicorn
* SQLAlchemy
* PyMySQL
* MySQL 8.0
* Docker
* Docker Compose

## Estructura principal del proyecto

```text
farmacia-backend/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.docker
├── main.py
├── database.py
├── models.py
├── schemas.py
├── requirements.txt
└── README.md
```

## Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

* Docker Desktop
* Docker Compose

Puedes verificarlo con:

```bash
docker --version
docker compose version
```

## Variables de entorno

El proyecto usa un archivo llamado `.env.docker` para configurar la conexión entre el backend y MySQL.

Ejemplo de `.env.docker`:

```env
DB_USER=root
DB_PASSWORD=rootpass
DB_HOST=db
DB_PORT=3306
DB_NAME=farmacia_db

MYSQL_ROOT_PASSWORD=rootpass
MYSQL_DATABASE=farmacia_db

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

ENVIRONMENT=development
CORS_ORIGINS=*
SECRET_KEY=dev_secret_farmacia_123456789
```

Importante:

* `DB_HOST=db` se usa porque el backend se conecta al servicio MySQL dentro de Docker Compose.
* `DB_PORT=3306` es el puerto interno de MySQL dentro de Docker.
* Desde la computadora, MySQL está disponible en el puerto `3307`.

## Ejecutar el proyecto con Docker Compose

Desde la carpeta raíz del backend, ejecuta:

```bash
docker compose up --build
```

Esto levantará dos contenedores:

```text
farmacia_backend
farmacia_mysql
```

El backend quedará disponible en:

```text
http://127.0.0.1:8001
```

## Verificar que el backend funciona

Abre en el navegador:

```text
http://127.0.0.1:8001/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "farmacia-api"
}
```

También puedes abrir la documentación automática de FastAPI:

```text
http://127.0.0.1:8001/docs
```

## Conexión a MySQL desde la computadora

Si quieres conectarte a la base de datos usando MySQL Workbench, DBeaver, TablePlus o alguna herramienta similar, usa estos datos:

```text
Host: 127.0.0.1
Puerto: 3307
Usuario: root
Contraseña: rootpass
Base de datos: farmacia_db
```

## Comandos útiles

Levantar el proyecto:

```bash
docker compose up
```

Levantar y reconstruir la imagen:

```bash
docker compose up --build
```

Detener los contenedores:

```bash
docker compose down
```

Ver contenedores activos:

```bash
docker ps
```

Ver logs del backend:

```bash
docker compose logs -f backend
```

Ver logs de MySQL:

```bash
docker compose logs -f db
```

Entrar al contenedor de MySQL:

```bash
docker exec -it farmacia_mysql mysql -uroot -prootpass
```

Dentro de MySQL:

```sql
SHOW DATABASES;
USE farmacia_db;
SHOW TABLES;
```

## Reiniciar la base de datos desde cero

Si necesitas borrar todos los datos del MySQL de Docker y empezar desde cero, ejecuta:

```bash
docker compose down -v
docker compose up --build
```

Advertencia: el comando `docker compose down -v` elimina el volumen de MySQL y borra los datos guardados en la base del contenedor.

Para detener el proyecto sin borrar datos, usa solamente:

```bash
docker compose down
```

## Notas importantes

* El archivo `.env.docker` no debe subirse a repositorios públicos si contiene contraseñas reales.
* Para desarrollo local, se puede usar `rootpass` como contraseña.
* Para producción, se deben cambiar las contraseñas y usar variables de entorno seguras.
* En producción, no se recomienda usar MySQL dentro del mismo Docker Compose. Lo ideal es usar una base de datos administrada como Cloud SQL, Railway, Render, PlanetScale u otro servicio similar.

## Estado actual

El proyecto ya puede ejecutarse de forma portable con Docker Compose:

```text
Backend FastAPI en Docker
MySQL 8.0 en Docker
Conexión entre backend y base de datos mediante red interna de Docker
```

URLs principales:

```text
Backend: http://127.0.0.1:8001
Health check: http://127.0.0.1:8001/health
Documentación API: http://127.0.0.1:8001/docs
```
