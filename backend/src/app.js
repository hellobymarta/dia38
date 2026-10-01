import express from 'express';
import cors from 'cors';

import { conectar } from './db.js';
import auth from './rutas/auth.js';
import publicaciones from './rutas/publicaciones.js';
import comentarios from './rutas/comentarios.js';
import { MAXIMO_IMAGEN } from './validacion.js';

const app = express();

// CORS_ORIGEN admite varias direcciones separadas por comas: la de local y la
// del frontend desplegado. En el día 32 aprendí que si a cors() le llega un
// origen vacío no añade ninguna cabecera y el navegador bloquea todo, así que
// aviso por consola en vez de dejarlo pasar en silencio.
const origenes = (process.env.CORS_ORIGEN || '')
  .split(',')
  .map((uno) => uno.trim())
  .filter(Boolean);

if (origenes.length === 0) {
  console.warn('Falta CORS_ORIGEN: la API queda abierta a cualquier origen.');
}

app.use(cors({ origin: origenes.length > 0 ? origenes : '*' }));

// Las fotografías viajan en Base64 dentro del JSON, que ocupa más que el
// archivo original. El límite por defecto de Express son 100 kB y se quedaba
// corto.
app.use(express.json({ limit: Math.ceil((MAXIMO_IMAGEN * 1.2) / 1_000_000) + 'mb' }));

// Comprueba que la API está viva, y a propósito no toca la base de datos: así
// puedo distinguir «la API no responde» de «responde pero no llega a Mongo».
//
// Digo si cada variable está puesta, nunca lo que vale: al desplegar es muy
// fácil olvidarse de una, y desde fuera no hay manera de saberlo.
app.get('/api/estado', (peticion, respuesta) => {
  respuesta.json({
    estado: 'en marcha',
    configuracion: {
      // Del URI enseño solo cómo empieza y cuánto mide: con eso veo si llegó
      // entero y bien escrito, sin que salgan el usuario ni la contraseña.
      MONGODB_URI: (process.env.MONGODB_URI || '').slice(0, 14),
      longitudDelURI: (process.env.MONGODB_URI || '').length,
      JWT_SECRETO: Boolean(process.env.JWT_SECRETO),
      origenesPermitidos: origenes,
    },
  });
});

// Abro la conexión antes de las rutas que usan datos. Como está cacheada, solo
// se conecta de verdad la primera vez.
async function conMongo(peticion, respuesta, siguiente) {
  if (!process.env.MONGODB_URI) {
    return respuesta.status(503).json({
      error: 'Falta la variable MONGODB_URI en el servidor.',
    });
  }

  try {
    await conectar();
    siguiente();
  } catch (fallo) {
    console.error(fallo);

    respuesta.status(503).json({
      error: 'No se ha podido conectar con la base de datos. Inténtalo en un momento.',
      detalle: fallo.message,
    });
  }
}

app.use('/api/auth', conMongo, auth);
app.use('/api/publicaciones', conMongo, publicaciones);
app.use('/api/comentarios', conMongo, comentarios);

app.use('/api', (peticion, respuesta) => {
  respuesta.status(404).json({ error: 'Esa ruta de la API no existe.' });
});

// El último recoge lo que no haya recogido nadie. Sin esto, un fallo de
// Mongoose dejaría la petición colgada.
app.use((fallo, peticion, respuesta, siguiente) => {
  console.error(fallo);

  if (fallo?.type === 'entity.too.large') {
    return respuesta.status(413).json({ error: 'La fotografía pesa demasiado.' });
  }

  if (fallo?.name === 'ValidationError') {
    const mensajes = Object.values(fallo.errors || {}).map((uno) => uno.message);
    return respuesta.status(400).json({ error: mensajes.join(' ') || 'Los datos no son válidos.' });
  }

  respuesta.status(500).json({ error: 'Error en el servidor.' });
});

export default app;
