export const normalizeRol = (rol = {}) => ({
  ...rol,
  idRol: Number(rol.idRol),
  rol: rol.rol ?? rol.nombre ?? '',
  nombre: rol.nombre ?? rol.rol ?? '',
  descripcion: rol.descripcion ?? '',
});

export const normalizeRoles = (roles = []) => roles.map(normalizeRol);
