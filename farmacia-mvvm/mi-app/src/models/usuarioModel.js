export const normalizeUsuario = (usuario = {}) => ({
  ...usuario,
  idUsuario: Number(usuario.idUsuario),
  idRol: usuario.idRol !== undefined && usuario.idRol !== null ? Number(usuario.idRol) : usuario.idRol,
  nombreRol: usuario.nombreRol ?? usuario.rol ?? usuario.nombre_rol ?? 'Sin rol',
  estatus: usuario.estatus === true ? 1 : Number(usuario.estatus ?? 1),
});

export const normalizeUsuarios = (usuarios = []) => usuarios.map(normalizeUsuario);
