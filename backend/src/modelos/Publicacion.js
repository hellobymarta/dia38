import mongoose from 'mongoose';

const esquema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true, maxlength: 120 },
    destino: { type: String, required: true, trim: true, maxlength: 80 },
    contenido: { type: String, required: true, trim: true, maxlength: 10000 },

    // La imagen va dentro del documento, en Base64, como pide el enunciado.
    // Por eso la lista está paginada: cada publicación arrastra su foto entera.
    imagen: { type: String, required: true },

    autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
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

export default mongoose.models.Publicacion || mongoose.model('Publicacion', esquema);
