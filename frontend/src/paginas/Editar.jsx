import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../servicios/api';
import { useSesion } from '../context/sesion';
import FormularioPublicacion from '../componentes/FormularioPublicacion.jsx';
import Aviso from '../componentes/Aviso.jsx';

export default function Editar() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { esMio } = useSesion();

  const [publicacion, setPublicacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .publicacion(id)
      .then(setPublicacion)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  const guardar = async (datos) => {
    await api.editarPublicacion(id, datos);
    navegar(`/publicacion/${id}`, { replace: true });
  };

  if (cargando) return <p className="text-sm text-suave">Cargando la publicación…</p>;

  if (error) return <Aviso tipo="mal">{error}</Aviso>;

  // La API vuelve a comprobarlo, pero sin esto se vería el formulario relleno
  // de una publicación ajena antes de que contestara que no.
  if (!esMio(publicacion)) return <Aviso tipo="mal">Esta publicación no es tuya.</Aviso>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="etiqueta">Editar</p>
        <h1 className="titular text-3xl">{publicacion.titulo}</h1>
      </div>

      <FormularioPublicacion
        inicial={{
          titulo: publicacion.titulo,
          destino: publicacion.destino,
          contenido: publicacion.contenido,
          imagen: publicacion.imagen,
        }}
        onGuardar={guardar}
        textoBoton="Guardar los cambios"
        onCancelar={() => navegar(`/publicacion/${id}`)}
      />
    </div>
  );
}
