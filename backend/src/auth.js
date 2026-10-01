import jwt from 'jsonwebtoken';

import Usuario from './modelos/Usuario.js';

const DURACION = '7d';

function secreto() {
  const valor = process.env.JWT_SECRETO;

  if (!valor) {
    throw new Error('Falta JWT_SECRETO en las variables de entorno.');
  }

  return valor;
}

export function firmarToken(usuario) {
  return jwt.sign({ id: usuario.id }, secreto(), { expiresIn: DURACION });
}

// Saca el token de la cabecera Authorization: Bearer <token>.
function tokenDeLaPeticion(peticion) {
  const cabecera = peticion.headers.authorization || '';
  return cabecera.startsWith('Bearer ') ? cabecera.slice(7).trim() : null;
}

// Para las rutas que exigen haber entrado. Si el token falta, está caducado o
// no es nuestro, corta aquí con un 401 y la ruta no llega a ejecutarse.
export async function exigirSesion(peticion, respuesta, siguiente) {
  const token = tokenDeLaPeticion(peticion);

  if (!token) {
    return respuesta.status(401).json({ error: 'Tienes que iniciar sesión para hacer esto.' });
  }

  try {
    const { id } = jwt.verify(token, secreto());
    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return respuesta.status(401).json({ error: 'Esta cuenta ya no existe.' });
    }

    peticion.usuario = usuario;
    siguiente();
  } catch (fallo) {
    const caducado = fallo.name === 'TokenExpiredError';

    respuesta.status(401).json({
      error: caducado ? 'Tu sesión ha caducado, vuelve a entrar.' : 'La sesión no es válida.',
    });
  }
}

// Comprueba que quien pide el cambio es quien escribió la cosa. Comparo los
// identificadores como texto porque uno viene de Mongo y el otro de la sesión.
export function esSuyo(documento, usuario) {
  return String(documento.autor?._id || documento.autor) === String(usuario._id);
}
