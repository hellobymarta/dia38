import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../servicios/api';
import { enTexto } from '../servicios/fechas';
import { useSesion } from '../context/sesion';
import Comentarios from '../componentes/Comentarios.jsx';
import Aviso from '../componentes/Aviso.jsx';

export default function Detalle() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { esMio } = useSesion();

  const [publicacion, setPublicacion] = useState(null);
  const [error, setError] = useState('');
  const [borrando, setBorrando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  // Mientras la publicación que tengo no sea la que pide la dirección, está
  // cargando. Así no hago falta un estado más solo para eso.
  const cargando = !error && publicacion?.id !== id;

  useEffect(() => {
    let vigente = true;

    api
      .publicacion(id)
      .then((llega) => {
        if (!vigente) return;
        setPublicacion(llega);
        setError('');
      })
      .catch((fallo) => {
        if (vigente) setError(fallo.message);
      });

    return () => {
      vigente = false;
    };
  }, [id]);

  const borrar = async () => {
    setBorrando(true);
    setError('');

    try {
      await api.borrarPublicacion(id);
      navegar('/');
    } catch (fallo) {
      setError(fallo.message);
      setBorrando(false);
    }
  };

  if (cargando) return <p className="text-sm text-suave">Cargando la publicación…</p>;

  if (error && !publicacion) {
    return (
      <div className="flex flex-col items-start gap-4">
        <Aviso tipo="mal">{error}</Aviso>
        <Link to="/" className="underline hover:text-acento">
          Volver al diario
        </Link>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="etiqueta">{publicacion.destino}</p>
        <h1 className="titular text-4xl">{publicacion.titulo}</h1>
        <p className="text-sm text-suave">
          {publicacion.autor?.nombre || 'Alguien'} · {enTexto(publicacion.createdAt)}
        </p>
      </div>

      <img
        src={publicacion.imagen}
        alt={publicacion.titulo}
        className="w-full rounded-lg border border-borde object-cover"
      />

      <div className="flex flex-col gap-4 whitespace-pre-line leading-relaxed">
        {publicacion.contenido}
      </div>

      {esMio(publicacion) && (
        <div className="flex flex-wrap items-center gap-3 border-t border-borde pt-6">
          <Link to={`/editar/${publicacion.id}`} className="boton-suave">
            Editar
          </Link>

          {confirmando ? (
            <>
              <span className="text-sm text-suave">¿Seguro? Se borrará también sus comentarios.</span>
              <button type="button" className="boton-suave" disabled={borrando} onClick={borrar}>
                {borrando ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
              <button type="button" className="boton-suave" onClick={() => setConfirmando(false)}>
                No
              </button>
            </>
          ) : (
            <button type="button" className="boton-suave" onClick={() => setConfirmando(true)}>
              Eliminar
            </button>
          )}
        </div>
      )}

      {error && <Aviso tipo="mal">{error}</Aviso>}

      <Comentarios
        publicacionId={publicacion.id}
        comentarios={publicacion.comentarios}
        onCambio={(comentarios) => setPublicacion({ ...publicacion, comentarios })}
      />

      <Link to="/" className="self-start underline hover:text-acento">
        Volver al diario
      </Link>
    </article>
  );
}
