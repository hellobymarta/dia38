import { Router } from 'express';
import mongoose from 'mongoose';

import Publicacion from '../modelos/Publicacion.js';
import Comentario from '../modelos/Comentario.js';
import { exigirSesion, esSuyo } from '../auth.js';
import { validarPublicacion, validarComentario, resumir } from '../validacion.js';

const router = Router();

const POR_PAGINA = 6;
const AUTOR = { path: 'autor', select: 'nombre' };

const idValido = (id) => mongoose.isValidObjectId(id);

const noExiste = (respuesta) =>
  respuesta.status(404).json({ error: 'No existe ninguna publicación con ese id.' });

// Traigo los comentarios de varias publicaciones de una vez y los reparto, en
// lugar de pedirlos publicación por publicación dentro de un bucle.
async function comentariosDe(ids) {
  const comentarios = await Comentario.find({ publicacion: { $in: ids } })
    .populate(AUTOR)
    .sort({ createdAt: 1 });

  const porPublicacion = new Map(ids.map((id) => [String(id), []]));

  comentarios.forEach((uno) => {
    porPublicacion.get(String(uno.publicacion))?.push(uno.toJSON());
  });

  return porPublicacion;
}

// GET /api/publicaciones?pagina=1 → público, con los comentarios dentro
router.get('/', async (peticion, respuesta, siguiente) => {
  try {
    const pagina = Math.max(1, Number(peticion.query.pagina) || 1);

    const total = await Publicacion.countDocuments();
    const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

    const publicaciones = await Publicacion.find()
      .populate(AUTOR)
      .sort({ createdAt: -1 })
      .skip((pagina - 1) * POR_PAGINA)
      .limit(POR_PAGINA);

    const comentarios = await comentariosDe(publicaciones.map((una) => una._id));

    respuesta.json({
      publicaciones: publicaciones.map((una) => ({
        ...una.toJSON(),
        comentarios: comentarios.get(String(una._id)) || [],
      })),
      pagina,
      paginas,
      total,
      porPagina: POR_PAGINA,
    });
  } catch (fallo) {
    siguiente(fallo);
  }
});

// GET /api/publicaciones/:id → público
router.get('/:id', async (peticion, respuesta, siguiente) => {
  try {
    if (!idValido(peticion.params.id)) return noExiste(respuesta);

    const publicacion = await Publicacion.findById(peticion.params.id).populate(AUTOR);

    if (!publicacion) return noExiste(respuesta);

    const comentarios = await Comentario.find({ publicacion: publicacion._id })
      .populate(AUTOR)
      .sort({ createdAt: 1 });

    respuesta.json({ ...publicacion.toJSON(), comentarios });
  } catch (fallo) {
    siguiente(fallo);
  }
});

// POST /api/publicaciones → hay que haber entrado
router.post('/', exigirSesion, async (peticion, respuesta, siguiente) => {
  try {
    const { valido, errores, limpio } = validarPublicacion(peticion.body);

    if (!valido) {
      return respuesta.status(400).json({ error: resumir(errores), errores });
    }

    const publicacion = await Publicacion.create({ ...limpio, autor: peticion.usuario._id });
    await publicacion.populate(AUTOR);

    respuesta.status(201).json({ ...publicacion.toJSON(), comentarios: [] });
  } catch (fallo) {
    siguiente(fallo);
  }
});

// PUT /api/publicaciones/:id → solo quien la escribió
router.put('/:id', exigirSesion, async (peticion, respuesta, siguiente) => {
  try {
    if (!idValido(peticion.params.id)) return noExiste(respuesta);

    const publicacion = await Publicacion.findById(peticion.params.id);

    if (!publicacion) return noExiste(respuesta);

    if (!esSuyo(publicacion, peticion.usuario)) {
      return respuesta.status(403).json({ error: 'Esta publicación no es tuya.' });
    }

    const { valido, errores, limpio } = validarPublicacion(peticion.body, { parcial: true });

    if (!valido) {
      return respuesta.status(400).json({ error: resumir(errores), errores });
    }

    Object.assign(publicacion, limpio);
    await publicacion.save();
    await publicacion.populate(AUTOR);

    const comentarios = await Comentario.find({ publicacion: publicacion._id })
      .populate(AUTOR)
      .sort({ createdAt: 1 });

    respuesta.json({ ...publicacion.toJSON(), comentarios });
  } catch (fallo) {
    siguiente(fallo);
  }
});

// DELETE /api/publicaciones/:id → solo quien la escribió
router.delete('/:id', exigirSesion, async (peticion, respuesta, siguiente) => {
  try {
    if (!idValido(peticion.params.id)) return noExiste(respuesta);

    const publicacion = await Publicacion.findById(peticion.params.id);

    if (!publicacion) return noExiste(respuesta);

    if (!esSuyo(publicacion, peticion.usuario)) {
      return respuesta.status(403).json({ error: 'Esta publicación no es tuya.' });
    }

    // Si borrase solo la publicación, sus comentarios se quedarían en la base
    // de datos apuntando a algo que ya no está.
    await Comentario.deleteMany({ publicacion: publicacion._id });
    await publicacion.deleteOne();

    respuesta.json({ eliminada: true, id: peticion.params.id });
  } catch (fallo) {
    siguiente(fallo);
  }
});

// POST /api/publicaciones/:id/comentarios → hay que haber entrado
router.post('/:id/comentarios', exigirSesion, async (peticion, respuesta, siguiente) => {
  try {
    if (!idValido(peticion.params.id)) return noExiste(respuesta);

    const publicacion = await Publicacion.findById(peticion.params.id);

    if (!publicacion) return noExiste(respuesta);

    const { valido, errores, limpio } = validarComentario(peticion.body);

    if (!valido) {
      return respuesta.status(400).json({ error: resumir(errores), errores });
    }

    const comentario = await Comentario.create({
      ...limpio,
      publicacion: publicacion._id,
      autor: peticion.usuario._id,
    });

    await comentario.populate(AUTOR);

    respuesta.status(201).json(comentario);
  } catch (fallo) {
    siguiente(fallo);
  }
});

export default router;
