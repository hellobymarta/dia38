// Las reglas de los formularios, en un solo sitio. El frontend las repite para
// avisar sin esperar a la red, pero quien manda es esta copia: a la API se le
// puede escribir desde fuera del formulario.

// La imagen llega como data URL (data:image/jpeg;base64,...). Compruebo que es
// una imagen de verdad y que no se pasa de tamaño: va dentro del documento de
// Mongo y Vercel tampoco acepta cuerpos enormes.
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
export const MAXIMO_IMAGEN = 1_500_000;

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');

export function validarRegistro(cuerpo = {}) {
  const errores = {};

  const nombre = texto(cuerpo.nombre);
  const email = texto(cuerpo.email).toLowerCase();
  const contrasena = typeof cuerpo.contrasena === 'string' ? cuerpo.contrasena : '';

  if (nombre.length < 2) errores.nombre = 'Escribe tu nombre.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.email = 'Ese correo no tiene buena pinta.';
  if (contrasena.length < 8) errores.contrasena = 'La contraseña necesita ocho caracteres como mínimo.';

  return { valido: Object.keys(errores).length === 0, errores, limpio: { nombre, email, contrasena } };
}

export function validarEntrada(cuerpo = {}) {
  const errores = {};

  const email = texto(cuerpo.email).toLowerCase();
  const contrasena = typeof cuerpo.contrasena === 'string' ? cuerpo.contrasena : '';

  if (!email) errores.email = 'Escribe tu correo.';
  if (!contrasena) errores.contrasena = 'Escribe tu contraseña.';

  return { valido: Object.keys(errores).length === 0, errores, limpio: { email, contrasena } };
}

export function validarImagen(valor) {
  if (typeof valor !== 'string' || !valor.startsWith('data:')) {
    return 'La publicación necesita una fotografía.';
  }

  const tipo = valor.slice(5).split(';')[0];

  if (!TIPOS.includes(tipo)) {
    return 'La fotografía tiene que ser JPG, PNG o WebP.';
  }

  if (valor.length > MAXIMO_IMAGEN) {
    return 'La fotografía pesa demasiado, elige una más ligera.';
  }

  return null;
}

export function validarPublicacion(cuerpo = {}, { parcial = false } = {}) {
  const errores = {};
  const limpio = {};
  const toca = (campo) => !parcial || cuerpo[campo] !== undefined;

  if (toca('titulo')) {
    const titulo = texto(cuerpo.titulo);
    if (titulo.length < 3) errores.titulo = 'El título es demasiado corto.';
    else if (titulo.length > 120) errores.titulo = 'El título es demasiado largo.';
    else limpio.titulo = titulo;
  }

  if (toca('destino')) {
    const destino = texto(cuerpo.destino);
    if (!destino) errores.destino = 'Escribe el destino.';
    else limpio.destino = destino;
  }

  if (toca('contenido')) {
    const contenido = texto(cuerpo.contenido);
    if (contenido.length < 20) errores.contenido = 'Cuenta un poco más, al menos veinte caracteres.';
    else if (contenido.length > 10000) errores.contenido = 'El texto es demasiado largo.';
    else limpio.contenido = contenido;
  }

  if (toca('imagen')) {
    const fallo = validarImagen(cuerpo.imagen);
    if (fallo) errores.imagen = fallo;
    else limpio.imagen = cuerpo.imagen;
  }

  if (parcial && Object.keys(limpio).length === 0 && Object.keys(errores).length === 0) {
    errores.general = 'No has cambiado nada.';
  }

  return { valido: Object.keys(errores).length === 0, errores, limpio };
}

export function validarComentario(cuerpo = {}) {
  const errores = {};
  const comentario = texto(cuerpo.texto);

  if (comentario.length < 2) errores.texto = 'Escribe el comentario.';
  else if (comentario.length > 1000) errores.texto = 'El comentario es demasiado largo.';

  return { valido: Object.keys(errores).length === 0, errores, limpio: { texto: comentario } };
}

export const resumir = (errores) => Object.values(errores).join(' ');
