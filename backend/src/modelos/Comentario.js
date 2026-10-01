import mongoose from 'mongoose';

const esquema = new mongoose.Schema(
  {
    texto: { type: String, required: true, trim: true, maxlength: 1000 },
    publicacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Publicacion', required: true, index: true },
    autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  },
  { timestamps: true }
);

esquema.set('toJSON', {
  versionKey: false,
  transform: (documento, salida) => {
    salida.id = salida._id.toString();
    delete salida._id;
  },
});

export default mongoose.models.Comentario || mongoose.model('Comentario', esquema);
