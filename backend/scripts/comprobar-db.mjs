// Comprueba que la cadena de conexión funciona: se conecta y cuenta lo que hay.
import mongoose from 'mongoose';

import Usuario from '../src/modelos/Usuario.js';
import Publicacion from '../src/modelos/Publicacion.js';
import Comentario from '../src/modelos/Comentario.js';

if (!process.env.MONGODB_URI) {
  console.error('Falta MONGODB_URI. Copia .env.example como .env y pon tu cadena de Atlas.');
  process.exit(1);
}

console.log('Base de datos:', process.env.MONGODB_URI.split('/').pop().split('?')[0]);

try {
  await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false, serverSelectionTimeoutMS: 10000 });
  console.log('Conectada.');
  console.log('Usuarios:', await Usuario.countDocuments());
  console.log('Publicaciones:', await Publicacion.countDocuments());
  console.log('Comentarios:', await Comentario.countDocuments());
  console.log('Todo en orden.');
} catch (error) {
  console.error('\nNo ha salido bien:', error.message);
  console.error('\nLo más habitual: la IP no está en la lista de Atlas, o el usuario o la contraseña no son los de la cadena.');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
