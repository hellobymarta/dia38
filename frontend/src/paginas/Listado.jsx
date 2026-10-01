import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { api } from '../servicios/api';
import { enTexto } from '../servicios/fechas';
import Paginacion from '../componentes/Paginacion.jsx';

export default function Listado() {
  const [parametros, setParametros] = useSearchParams();
  const pagina = Math.max(1, Number(parametros.get('pagina')) || 1);

  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  // No guardo «cargando» en un estado: lo sé comparando la página que pide la
  // dirección con la que tengo pintada.
  const cargando = !error && (!datos || datos.pagina !== pagina);

  // La página viaja en la dirección, no en el estado del componente: así se
  // puede compartir el enlace de la página 2 y el botón de atrás funciona.
  useEffect(() => {
    let vigente = true;

    api
      .publicaciones(pagina)
      .then((llegan) => {
        if (!vigente) return;
        setDatos(llegan);
        setError('');
      })
      .catch((fallo) => {
        if (vigente) setError(fallo.message);
      });

    // Si cambio de página antes de que conteste la anterior, descarto su
    // respuesta en vez de pintarla encima de la nueva.
    return () => {
      vigente = false;
    };
  }, [pagina, intento]);

  const irA = (numero) => {
    setParametros(numero === 1 ? {} : { pagina: String(numero) });
    window.scrollTo({ top: 0 });
  };

  const reintentar = () => {
    setError('');
    setIntento((vuelta) => vuelta + 1);
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <p className="etiqueta">Vagamundo</p>
        <h1 className="titular text-4xl sm:text-5xl">El diario</h1>
        <p className="max-w-xl text-suave">
          Crónicas de nuestros viajes en grupo pequeño, escritas por quien estuvo allí. Se leen sin
          cuenta; para escribir o comentar hay que entrar.
        </p>
      </section>

      {cargando && <p className="text-sm text-suave">Cargando las publicaciones…</p>}

      {error && !cargando && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">{error}</p>
          <button type="button" className="boton-suave" onClick={reintentar}>
            Reintentar
          </button>
        </div>
      )}

      {datos && !cargando && !error && datos.publicaciones.length === 0 && (
        <p className="text-sm text-suave">Todavía no hay ninguna publicación.</p>
      )}

      {datos && !cargando && !error && datos.publicaciones.length > 0 && (
        <>
          <ul className="flex flex-col gap-8">
            {datos.publicaciones.map((una) => (
              <li key={una.id} className="overflow-hidden rounded-lg border border-borde bg-hueso">
                <Link to={`/publicacion/${una.id}`} className="block">
                  <img
                    src={una.imagen}
                    alt={una.titulo}
                    loading="lazy"
                    className="h-64 w-full object-cover"
                  />
                </Link>

                <div className="flex flex-col gap-3 p-6">
                  <p className="etiqueta">{una.destino}</p>

                  <Link to={`/publicacion/${una.id}`} className="titular text-2xl hover:text-acento">
                    {una.titulo}
                  </Link>

                  <p className="text-sm text-suave">
                    {una.autor?.nombre || 'Alguien'} · {enTexto(una.createdAt)} ·{' '}
                    {una.comentarios.length === 1
                      ? '1 comentario'
                      : `${una.comentarios.length} comentarios`}
                  </p>

                  <p className="line-clamp-3 text-suave">{una.contenido}</p>

                  <Link
                    to={`/publicacion/${una.id}`}
                    className="self-start text-sm underline hover:text-acento"
                  >
                    Seguir leyendo
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          <Paginacion pagina={datos.pagina} paginas={datos.paginas} onCambiar={irA} />
        </>
      )}
    </div>
  );
}
