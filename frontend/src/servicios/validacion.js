// Las mismas reglas que la API, repetidas aquí para avisar sin esperar a la
// red. No sustituyen a las de la API: a los endpoints se les puede escribir
// desde fuera del formulario, así que allí se vuelve a comprobar todo.

export const MAXIMO_IMAGEN = 1_500_000;

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');

export function validarRegistro({ nombre, email, contrasena }) {
  const errores = {};

  if (texto(nombre).length < 2) errores.nombre = 'Escribe tu nombre.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto(email))) errores.email = 'Ese correo no tiene buena pinta.';
  if ((contrasena || '').length < 8) errores.contrasena = 'La contraseña necesita ocho caracteres como mínimo.';

  return errores;
}

export function validarEntrada({ email, contrasena }) {
  const errores = {};

  if (!texto(email)) errores.email = 'Escribe tu correo.';
  if (!contrasena) errores.contrasena = 'Escribe tu contraseña.';

  return errores;
}

export function validarPublicacion({ titulo, destino, contenido, imagen }) {
  const errores = {};

  if (texto(titulo).length < 3) errores.titulo = 'El título es demasiado corto.';
  if (!texto(destino)) errores.destino = 'Escribe el destino.';
  if (texto(contenido).length < 20) errores.contenido = 'Cuenta un poco más, al menos veinte caracteres.';
  if (!imagen) errores.imagen = 'La publicación necesita una fotografía.';
  else if (imagen.length > MAXIMO_IMAGEN) errores.imagen = 'La fotografía pesa demasiado.';

  return errores;
}

export function validarComentario(texto_) {
  return texto(texto_).length < 2 ? { texto: 'Escribe el comentario.' } : {};
}
