import { Router } from 'express';
import mongoose from 'mongoose';

import Comentario from '../modelos/Comentario.js';
import { exigirSesion, esSuyo } from '../auth.js';
import { validarComentario, resumir } from '../validacion.js';

const router = Router();

const AUTOR = { path: 'autor', select: 'nombre' };

const idValido = (id) => mongoose.isValidObjectId(id);

const noExiste = (respuesta) =>
  respuesta.status(404).json({ error: 'No existe ningún comentario con ese id.' });

// Crear un comentario va en la ruta de la publicación, porque un comentario
// siempre nace colgado de una. Aquí quedan editarlo y borrarlo, que solo
// necesitan su propio id.

// PUT /api/comentarios/:id
router.put('/:id', exigirSesion, async (peticion, respuesta, siguiente) => {
  try {
    if (!idValido(peticion.params.id)) return noExiste(respuesta);

    const comentario = await Comentario.findById(peticion.params.id);

    if (!comentario) return noExiste(respuesta);

    if (!esSuyo(comentario, peticion.usuario)) {
      return respuesta.status(403).json({ error: 'Este comentario no es tuyo.' });
    }

    const { valido, errores, limpio } = validarComentario(peticion.body);

    if (!valido) {
      return respuesta.status(400).json({ error: resumir(errores), errores });
    }

    comentario.texto = limpio.texto;
    await comentario.save();
    await comentario.populate(AUTOR);

    respuesta.json(comentario);
  } catch (fallo) {
    siguiente(fallo);
  }
});

// DELETE /api/comentarios/:id
router.delete('/:id', exigirSesion, async (peticion, respuesta, siguiente) => {
  try {
    if (!idValido(peticion.params.id)) return noExiste(respuesta);

    const comentario = await Comentario.findById(peticion.params.id);

    if (!comentario) return noExiste(respuesta);

    if (!esSuyo(comentario, peticion.usuario)) {
      return respuesta.status(403).json({ error: 'Este comentario no es tuyo.' });
    }

    await comentario.deleteOne();

    respuesta.json({ eliminado: true, id: peticion.params.id });
  } catch (fallo) {
    siguiente(fallo);
  }
});

export default router;
