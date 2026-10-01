// Todas las llamadas a la API pasan por aquí: así el token y el tratamiento de
// los errores se escriben una sola vez.

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const CLAVE_TOKEN = 'vagamundo-blog-token';

export const leerToken = () => {
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    // En navegación privada el acceso a localStorage puede lanzar.
    return null;
  }
};

export const guardarToken = (token) => {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    // Si no se puede guardar, la sesión dura lo que dure la pestaña.
  }
};

export async function pedir(ruta, opciones = {}) {
  const token = leerToken();

  const cabeceras = {};
  if (opciones.cuerpo) cabeceras['Content-Type'] = 'application/json';
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta;

  try {
    respuesta = await fetch(BASE + ruta, {
      method: opciones.metodo || 'GET',
      headers: cabeceras,
      body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
    });
  } catch {
    // Aquí se cae tanto si la API no está levantada como si el navegador ha
    // cortado la petición por CORS: desde JavaScript las dos se ven igual, un
    // fetch que se rompe sin respuesta que leer.
    throw new Error(
      `No ha habido respuesta de la API (${BASE || 'sin dirección configurada'}). ` +
        'O no está levantada, o no acepta peticiones desde esta dirección.'
    );
  }

  // Leo como texto y luego intento convertir: si contesta algo que no es mi
  // API y devuelve HTML, con .json() saltaría un «Unexpected token '<'».
  const texto = await respuesta.text();

  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    const fallo = new Error(
      (datos && datos.error) || `La API respondió con un error ${respuesta.status}.`
    );
    fallo.estado = respuesta.status;
    fallo.errores = datos?.errores;
    throw fallo;
  }

  return datos;
}

export const api = {
  registro: (cuerpo) => pedir('/api/auth/registro', { metodo: 'POST', cuerpo }),
  entrar: (cuerpo) => pedir('/api/auth/entrar', { metodo: 'POST', cuerpo }),
  yo: () => pedir('/api/auth/yo'),

  publicaciones: (pagina = 1) => pedir(`/api/publicaciones?pagina=${pagina}`),
  publicacion: (id) => pedir(`/api/publicaciones/${id}`),
  crearPublicacion: (cuerpo) => pedir('/api/publicaciones', { metodo: 'POST', cuerpo }),
  editarPublicacion: (id, cuerpo) => pedir(`/api/publicaciones/${id}`, { metodo: 'PUT', cuerpo }),
  borrarPublicacion: (id) => pedir(`/api/publicaciones/${id}`, { metodo: 'DELETE' }),

  comentar: (id, cuerpo) => pedir(`/api/publicaciones/${id}/comentarios`, { metodo: 'POST', cuerpo }),
  editarComentario: (id, cuerpo) => pedir(`/api/comentarios/${id}`, { metodo: 'PUT', cuerpo }),
  borrarComentario: (id) => pedir(`/api/comentarios/${id}`, { metodo: 'DELETE' }),
};
