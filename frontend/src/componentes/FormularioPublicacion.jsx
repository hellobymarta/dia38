import { useState } from 'react';

import CampoImagen from './CampoImagen.jsx';
import Aviso from './Aviso.jsx';
import { validarPublicacion } from '../servicios/validacion';

const VACIO = { titulo: '', destino: '', contenido: '', imagen: '' };

const Fallo = ({ texto }) => (texto ? <p className="text-sm text-red-700">{texto}</p> : null);

export default function FormularioPublicacion({ inicial, onGuardar, textoBoton, onCancelar }) {
  const [datos, setDatos] = useState({ ...VACIO, ...inicial });
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (evento) => {
    setDatos({ ...datos, [campo]: evento.target.value });
    setErrores({ ...errores, [campo]: undefined });
  };

  const enviar = async (evento) => {
    evento.preventDefault();

    const encontrados = validarPublicacion(datos);

    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      setAviso('');
      return;
    }

    setGuardando(true);
    setAviso('');

    try {
      await onGuardar(datos);
    } catch (fallo) {
      setAviso(fallo.message);
      // La API devuelve también el detalle por campo, para pintarlo debajo de
      // cada uno en vez de solo arriba.
      if (fallo.errores) setErrores(fallo.errores);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="etiqueta" htmlFor="titulo">
          Título
        </label>
        <input id="titulo" className="campo" value={datos.titulo} onChange={cambiar('titulo')} />
        <Fallo texto={errores.titulo} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="etiqueta" htmlFor="destino">
          Destino
        </label>
        <input id="destino" className="campo" value={datos.destino} onChange={cambiar('destino')} />
        <Fallo texto={errores.destino} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="etiqueta" htmlFor="contenido">
          La crónica
        </label>
        <textarea
          id="contenido"
          rows={10}
          className="campo"
          value={datos.contenido}
          onChange={cambiar('contenido')}
        />
        <Fallo texto={errores.contenido} />
      </div>

      <CampoImagen
        valor={datos.imagen}
        error={errores.imagen}
        onCambiar={(imagen) => {
          setDatos({ ...datos, imagen });
          setErrores({ ...errores, imagen: undefined });
        }}
      />

      <Aviso tipo="mal">{aviso}</Aviso>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="boton" disabled={guardando}>
          {guardando ? 'Guardando…' : textoBoton}
        </button>

        {onCancelar && (
          <button type="button" className="boton-suave" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
