# Migración a MVVM

Se reorganizó el frontend para separar responsabilidades y reducir código duplicado.

## Estructura nueva

```text
src/
├── hooks/            # ViewModels: estado, validaciones, navegación y acciones de pantalla
├── models/           # Normalización de datos recibidos desde el backend
├── repositories/     # Acceso a endpoints por módulo
├── services/         # API client, caché, red y fachada offline
├── screens/          # Vistas: JSX, estilos y presentación
└── constants/        # Configuración general
```

## Responsabilidades

- **screens**: renderizan UI y estilos. La lógica de consulta de los listados principales se migró a hooks.
- **hooks**: funcionan como ViewModels. Manejan estados como `loading`, filtros, refresco, navegación y llamadas a datos.
- **repositories**: encapsulan endpoints REST por módulo, por ejemplo productos, ventas, compras, usuarios, proveedores.
- **models**: normalizan campos para mantener compatibilidad con la API y el frontend (`stock`, `stockActual`, `precioVenta`, `rol`, `nombre`, etc.).
- **services**: centralizan `fetch`, timeout, caché offline, NetInfo y sincronización.

## Pantallas ya conectadas a ViewModel

- Login
- Productos
- Inventario
- Proveedores
- Usuarios
- Ventas
- Compras

## Compatibilidad

`src/services/dataService.js` se mantiene como fachada para no romper pantallas existentes, pero internamente ahora usa repositories, models, cacheService y networkService.

## Comandos

```bash
npm install
npx expo start
```

Si PowerShell bloquea scripts:

```powershell
npm.cmd install
npx.cmd expo start
```
