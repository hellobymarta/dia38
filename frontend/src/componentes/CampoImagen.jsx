import { useRef, useState } from 'react';

import { MAXIMO_IMAGEN } from '../servicios/validacion';

const LADO_MAXIMO = 1200;

// La fotografía se guarda dentro del documento de Mongo en Base64, y una foto
// del móvil puede ocupar varios megas. Antes de convertirla la encojo con un
// canvas: la dibujo más pequeña y la vuelvo a sacar en JPEG, bajando la calidad
// hasta que cabe. Si mandara el archivo tal cual, la API la rechazaría.
async function aBase64(archivo) {
  const imagen = await new Promise((listo, fallo) => {
    const lector = new FileReader();
    lector.onload = () => {
      const elemento = new Image();
      elemento.onload = () => listo(elemento);
      elemento.onerror = () => fallo(new Error('No he podido leer esa imagen.'));
      elemento.src = lector.result;
    };
    lector.onerror = () => fallo(new Error('No he podido leer ese archivo.'));
    lector.readAsDataURL(archivo);
  });

  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

  for (const calidad of [0.82, 0.7, 0.6, 0.5, 0.4]) {
    const datos = lienzo.toDataURL('image/jpeg', calidad);
    if (datos.length <= MAXIMO_IMAGEN) return datos;
  }

  throw new Error('Esa fotografía pesa demasiado incluso después de reducirla.');
}

export default function CampoImagen({ valor, onCambiar, error }) {
  const entrada = useRef(null);
  const [preparando, setPreparando] = useState(false);
  const [fallo, setFallo] = useState('');

  const elegir = async (evento) => {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    setPreparando(true);
    setFallo('');

    try {
      onCambiar(await aBase64(archivo));
    } catch (problema) {
      setFallo(problema.message);
      onCambiar('');
    } finally {
      setPreparando(false);
      // Dejo el input vacío para poder volver a elegir el mismo archivo.
      evento.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="etiqueta">Fotografía</span>

      {valor && (
        <img
          src={valor}
          alt="La fotografía elegida"
          className="max-h-72 w-full rounded-lg border border-borde object-cover"
        />
      )}

      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={elegir}
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="boton-suave"
          disabled={preparando}
          onClick={() => entrada.current?.click()}
        >
          {preparando ? 'Preparando…' : valor ? 'Cambiar la fotografía' : 'Elegir una fotografía'}
        </button>

        {valor && (
          <span className="text-sm text-suave">
            Ocupa {Math.round(valor.length / 1024)} kB una vez convertida
          </span>
        )}
      </div>

      {(fallo || error) && <p className="text-sm text-red-700">{fallo || error}</p>}
    </div>
  );
}
