import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const esquema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // Guardo el hash, nunca la contraseña. Y con select: false no sale en las
    // consultas a menos que lo pida a propósito, así no se me escapa en una
    // respuesta por descuido.
    contrasena: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

// Cifro aquí y no en la ruta, para que no haya forma de guardar un usuario con
// la contraseña en claro por olvidarse de hacerlo en algún sitio.
esquema.pre('save', async function cifrar() {
  if (!this.isModified('contrasena')) return;
  this.contrasena = await bcrypt.hash(this.contrasena, 10);
});

esquema.methods.contrasenaCorrecta = function comprobar(enClaro) {
  return bcrypt.compare(enClaro, this.contrasena);
};

esquema.set('toJSON', {
  versionKey: false,
  transform: (documento, salida) => {
    salida.id = salida._id.toString();
    delete salida._id;
    delete salida.contrasena;
  },
});

export default mongoose.models.Usuario || mongoose.model('Usuario', esquema);
