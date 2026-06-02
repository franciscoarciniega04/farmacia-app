export const normalizeCategoria = (categoria = {}) => ({
  ...categoria,
  idCategoria: Number(categoria.idCategoria),
  nombre: categoria.nombre ?? '',
  descripcion: categoria.descripcion ?? '',
});

export const normalizeCategorias = (categorias = []) => categorias.map(normalizeCategoria);
