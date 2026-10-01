import { Router } from 'express';

import Usuario from '../modelos/Usuario.js';
import { firmarToken, exigirSesion } from '../auth.js';
import { validarRegistro, validarEntrada, resumir } from '../validacion.js';

const router = Router();

// POST /api/auth/registro
router.post('/registro', async (peticion, respuesta, siguiente) => {
  try {
    const { valido, errores, limpio } = validarRegistro(peticion.body);

    if (!valido) {
      return respuesta.status(400).json({ error: resumir(errores), errores });
    }

    if (await Usuario.exists({ email: limpio.email })) {
      return respuesta.status(409).json({ error: 'Ya hay una cuenta con ese correo.' });
    }

    const usuario = await Usuario.create(limpio);

    respuesta.status(201).json({ token: firmarToken(usuario), usuario });
  } catch (fallo) {
    siguiente(fallo);
  }
});

// POST /api/auth/entrar
router.post('/entrar', async (peticion, respuesta, siguiente) => {
  try {
    const { valido, errores, limpio } = validarEntrada(peticion.body);

    if (!valido) {
      return respuesta.status(400).json({ error: resumir(errores), errores });
    }

    // La contraseña no viene en las consultas normales, hay que pedirla.
    const usuario = await Usuario.findOne({ email: limpio.email }).select('+contrasena');

    // El mismo mensaje tanto si el correo no existe como si la contraseña no
    // es la buena: así nadie puede averiguar qué correos están registrados.
    if (!usuario || !(await usuario.contrasenaCorrecta(limpio.contrasena))) {
      return respuesta.status(401).json({ error: 'El correo o la contraseña no son correctos.' });
    }

    respuesta.json({ token: firmarToken(usuario), usuario });
  } catch (fallo) {
    siguiente(fallo);
  }
});

// GET /api/auth/yo → sirve para que el frontend compruebe, al abrir la página,
// si el token que tiene guardado sigue valiendo.
router.get('/yo', exigirSesion, (peticion, respuesta) => {
  respuesta.json({ usuario: peticion.usuario });
});

export default router;
