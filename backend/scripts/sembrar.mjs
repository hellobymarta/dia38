// Deja el blog con algo que enseñar: una cuenta de ejemplo, cuatro crónicas con
// su fotografía y unos comentarios. Si ya hay publicaciones, no toca nada.
//
// Las fotografías salen de scripts/semilla y se convierten a Base64 aquí, que
// es como las guarda la aplicación cuando las subes desde el formulario.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';

import Usuario from '../src/modelos/Usuario.js';
import Publicacion from '../src/modelos/Publicacion.js';
import Comentario from '../src/modelos/Comentario.js';

const CARPETA = path.join(import.meta.dirname, 'semilla');

const CUENTAS = [
  { nombre: 'Marta', email: 'marta@vagamundo.es', contrasena: 'vagamundo2026' },
  { nombre: 'Nerea Ortiz', email: 'nerea@vagamundo.es', contrasena: 'vagamundo2026' },
];

const CRONICAS = [
  {
    titulo: 'Kirkjufell, la montaña que sale en todas las fotos',
    destino: 'Islandia',
    archivo: 'islandia-kirkjufell.jpg',
    contenido:
      'Llegamos a Grundarfjördur con la idea de hacer la foto de siempre y nos quedamos tres horas. ' +
      'La montaña cambia de color cada vez que se mueve una nube, y detrás, las cascadas bajan tan ' +
      'cerca del camino que se oyen antes de verlas. Si vais, dejad el coche en el aparcamiento de ' +
      'abajo y subid andando: el mejor ángulo no es el del cartel.',
    comentarios: ['Estuvimos en marzo y había nieve hasta el sendero. Merece la pena ir con botas.'],
  },
  {
    titulo: 'Kioto en abril, entre templos y gente',
    destino: 'Japón',
    archivo: 'japon-kioto.jpg',
    contenido:
      'Abril en Kioto es precioso y está llenísimo, las dos cosas a la vez. Lo que nos salvó fue ' +
      'madrugar: a las siete de la mañana los templos del este están casi vacíos y se puede andar ' +
      'por Higashiyama sin esquivar a nadie. A mediodía nos íbamos al norte, que está mucho más ' +
      'tranquilo, y volvíamos al atardecer.',
    comentarios: [
      'Lo de madrugar es el mejor consejo que he leído de Kioto.',
      'Nosotros fuimos en noviembre y los arces compensan de sobra el no ver cerezos.',
    ],
  },
  {
    titulo: 'Ajloun, el castillo del que nadie habla',
    destino: 'Jordania',
    archivo: 'jordania-ajloun.jpg',
    contenido:
      'Todo el mundo va a Petra y a Wadi Rum, y hace bien, pero el norte de Jordania tiene un ' +
      'castillo del siglo XII en lo alto de una colina desde el que se ve el valle entero. Fuimos un ' +
      'martes por la mañana y estábamos nosotros y el señor de la entrada. Se tarda una hora desde ' +
      'Ammán y cabe perfectamente en una mañana.',
    comentarios: ['Apuntado para el próximo viaje, no lo tenía ni en la lista.'],
  },
  {
    titulo: 'Diamond Beach y los icebergs que se escapan al mar',
    destino: 'Islandia',
    archivo: 'islandia-diamond.jpg',
    contenido:
      'Enfrente de la laguna de Jökulsárlón hay una playa de arena negra donde acaban los trozos de ' +
      'hielo que la corriente arrastra. Con el sol bajo parecen cristales. Hay que tener cuidado con ' +
      'las olas, que suben mucho más de lo que parece, y no subirse a los bloques por muy quietos ' +
      'que estén.',
    comentarios: [],
  },
];

async function enBase64(archivo) {
  const datos = await readFile(path.join(CARPETA, archivo));
  return `data:image/jpeg;base64,${datos.toString('base64')}`;
}

if (!process.env.MONGODB_URI) {
  console.error('Falta MONGODB_URI. Copia .env.example como .env y pon tu cadena de Atlas.');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });

  if ((await Publicacion.countDocuments()) > 0) {
    console.log('Ya hay publicaciones, no añado nada.');
  } else {
    const usuarios = [];

    for (const cuenta of CUENTAS) {
      const existente = await Usuario.findOne({ email: cuenta.email });
      usuarios.push(existente || (await Usuario.create(cuenta)));
    }

    for (const [posicion, cronica] of CRONICAS.entries()) {
      const autor = usuarios[posicion % usuarios.length];

      const publicacion = await Publicacion.create({
        titulo: cronica.titulo,
        destino: cronica.destino,
        contenido: cronica.contenido,
        imagen: await enBase64(cronica.archivo),
        autor: autor._id,
      });

      for (const [vuelta, texto] of cronica.comentarios.entries()) {
        await Comentario.create({
          texto,
          publicacion: publicacion._id,
          autor: usuarios[(posicion + vuelta + 1) % usuarios.length]._id,
        });
      }
    }

    console.log('Añadidas', CRONICAS.length, 'publicaciones y', usuarios.length, 'cuentas.');
    console.log('Cuenta de ejemplo:', CUENTAS[0].email, '·', CUENTAS[0].contrasena);
  }
} catch (error) {
  console.error('No ha salido bien:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
