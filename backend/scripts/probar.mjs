// Prueba la API de punta a punta contra el servidor que esté levantado: crea
// dos cuentas, publica, comenta, intenta tocar lo ajeno y lo limpia todo al
// terminar. Lo que deja en la base de datos es nada si acaba bien.
//
//   npm run dev        (en una pestaña)
//   npm run probar     (en otra)

const BASE = process.env.API_URL || 'http://localhost:3001';

let fallos = 0;

function comprobar(titulo, condicion, detalle = '') {
  console.log(`${condicion ? '  ok  ' : 'FALLA '} ${titulo}${detalle ? ' · ' + detalle : ''}`);
  if (!condicion) fallos += 1;
}

async function pedir(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const cabeceras = {};
  if (cuerpo) cabeceras['Content-Type'] = 'application/json';
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  const respuesta = await fetch(BASE + ruta, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

  const texto = await respuesta.text();

  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = null;
  }

  return { estado: respuesta.status, datos };
}

// Un píxel en PNG, para no depender de ningún archivo.
const IMAGEN =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const sello = Date.now();
const ana = { nombre: 'Ana Prueba', email: `ana.${sello}@prueba.es`, contrasena: 'contrasena123' };
const luis = { nombre: 'Luis Prueba', email: `luis.${sello}@prueba.es`, contrasena: 'contrasena123' };

console.log('Probando', BASE, '\n');

const estado = await pedir('/api/estado');
comprobar('la API responde', estado.estado === 200, JSON.stringify(estado.datos));

if (estado.estado !== 200) {
  console.error('\nNo hay nadie escuchando. Levanta la API con npm run dev.');
  process.exit(1);
}

console.log('\n-- cuentas --');
const registroAna = await pedir('/api/auth/registro', { metodo: 'POST', cuerpo: ana });
comprobar('registro devuelve 201 y token', registroAna.estado === 201 && Boolean(registroAna.datos?.token));
comprobar('el registro no devuelve la contraseña', !('contrasena' in (registroAna.datos?.usuario || {})));

const repetido = await pedir('/api/auth/registro', { metodo: 'POST', cuerpo: ana });
comprobar('no deja repetir el correo', repetido.estado === 409);

const corta = await pedir('/api/auth/registro', {
  metodo: 'POST',
  cuerpo: { nombre: 'X', email: 'no-es-un-correo', contrasena: '123' },
});
comprobar('valida nombre, correo y contraseña', corta.estado === 400, corta.datos?.error);

const registroLuis = await pedir('/api/auth/registro', { metodo: 'POST', cuerpo: luis });
const tokenAna = registroAna.datos.token;
const tokenLuis = registroLuis.datos.token;

const mala = await pedir('/api/auth/entrar', {
  metodo: 'POST',
  cuerpo: { email: ana.email, contrasena: 'otra-cosa' },
});
comprobar('contraseña incorrecta devuelve 401', mala.estado === 401);

const buena = await pedir('/api/auth/entrar', {
  metodo: 'POST',
  cuerpo: { email: ana.email, contrasena: ana.contrasena },
});
comprobar('entrar devuelve token', buena.estado === 200 && Boolean(buena.datos?.token));

const yo = await pedir('/api/auth/yo', { token: tokenAna });
comprobar('/auth/yo con token devuelve el usuario', yo.estado === 200 && yo.datos?.usuario?.email === ana.email);

const yoSin = await pedir('/api/auth/yo');
comprobar('/auth/yo sin token devuelve 401', yoSin.estado === 401);

const yoRaro = await pedir('/api/auth/yo', { token: 'esto-no-es-un-token' });
comprobar('/auth/yo con token inventado devuelve 401', yoRaro.estado === 401);

console.log('\n-- publicaciones --');
const publica = { titulo: 'Prueba automática', destino: 'Ninguno', contenido: 'Texto de prueba suficientemente largo.', imagen: IMAGEN };

const sinSesion = await pedir('/api/publicaciones', { metodo: 'POST', cuerpo: publica });
comprobar('publicar sin sesión devuelve 401', sinSesion.estado === 401);

const sinImagen = await pedir('/api/publicaciones', {
  metodo: 'POST',
  token: tokenAna,
  cuerpo: { ...publica, imagen: undefined },
});
comprobar('la imagen es obligatoria', sinImagen.estado === 400, sinImagen.datos?.error);

const noEsImagen = await pedir('/api/publicaciones', {
  metodo: 'POST',
  token: tokenAna,
  cuerpo: { ...publica, imagen: 'data:text/plain;base64,aG9sYQ==' },
});
comprobar('rechaza lo que no es una imagen', noEsImagen.estado === 400, noEsImagen.datos?.error);

const creada = await pedir('/api/publicaciones', { metodo: 'POST', token: tokenAna, cuerpo: publica });
comprobar('publicar con sesión devuelve 201', creada.estado === 201);
comprobar('la publicación trae su autor', creada.datos?.autor?.nombre === ana.nombre);

const idPublicacion = creada.datos.id;

const lista = await pedir('/api/publicaciones');
comprobar('el listado es público', lista.estado === 200);
comprobar('el listado viene paginado', typeof lista.datos?.paginas === 'number' && typeof lista.datos?.pagina === 'number');
comprobar('cada publicación trae sus comentarios', Array.isArray(lista.datos?.publicaciones?.[0]?.comentarios));

const ajena = await pedir(`/api/publicaciones/${idPublicacion}`, {
  metodo: 'PUT',
  token: tokenLuis,
  cuerpo: { titulo: 'Intento de secuestro' },
});
comprobar('no se puede editar lo ajeno', ajena.estado === 403);

const editada = await pedir(`/api/publicaciones/${idPublicacion}`, {
  metodo: 'PUT',
  token: tokenAna,
  cuerpo: { titulo: 'Prueba automática corregida' },
});
comprobar('editar lo propio funciona', editada.estado === 200 && editada.datos?.titulo === 'Prueba automática corregida');

const inexistente = await pedir('/api/publicaciones/000000000000000000000000');
comprobar('id que no existe devuelve 404', inexistente.estado === 404);

const idRaro = await pedir('/api/publicaciones/pepito');
comprobar('id con mala forma devuelve 404', idRaro.estado === 404);

console.log('\n-- comentarios --');
const comentarioSin = await pedir(`/api/publicaciones/${idPublicacion}/comentarios`, {
  metodo: 'POST',
  cuerpo: { texto: 'Hola' },
});
comprobar('comentar sin sesión devuelve 401', comentarioSin.estado === 401);

const comentario = await pedir(`/api/publicaciones/${idPublicacion}/comentarios`, {
  metodo: 'POST',
  token: tokenLuis,
  cuerpo: { texto: 'Comentario de prueba' },
});
comprobar('comentar con sesión devuelve 201', comentario.estado === 201);

const idComentario = comentario.datos.id;

const borrarAjeno = await pedir(`/api/comentarios/${idComentario}`, { metodo: 'DELETE', token: tokenAna });
comprobar('no se puede borrar un comentario ajeno', borrarAjeno.estado === 403);

const editarComentario = await pedir(`/api/comentarios/${idComentario}`, {
  metodo: 'PUT',
  token: tokenLuis,
  cuerpo: { texto: 'Comentario corregido' },
});
comprobar('editar el propio comentario funciona', editarComentario.estado === 200);

const conComentario = await pedir(`/api/publicaciones/${idPublicacion}`);
comprobar('el comentario sale en la publicación', conComentario.datos?.comentarios?.length === 1);

console.log('\n-- limpieza --');
const borrarPublicacionAjena = await pedir(`/api/publicaciones/${idPublicacion}`, {
  metodo: 'DELETE',
  token: tokenLuis,
});
comprobar('no se puede borrar una publicación ajena', borrarPublicacionAjena.estado === 403);

const borrada = await pedir(`/api/publicaciones/${idPublicacion}`, { metodo: 'DELETE', token: tokenAna });
comprobar('borrar la propia funciona', borrada.estado === 200);

const comentarioHuerfano = await pedir(`/api/comentarios/${idComentario}`, { metodo: 'DELETE', token: tokenLuis });
comprobar('sus comentarios se han ido con ella', comentarioHuerfano.estado === 404);

console.log(fallos === 0 ? '\nTodo correcto.' : `\n${fallos} comprobaciones han fallado.`);
console.log('Quedan las dos cuentas de prueba:', ana.email, 'y', luis.email);

process.exitCode = fallos === 0 ? 0 : 1;
