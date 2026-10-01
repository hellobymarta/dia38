import { useNavigate } from 'react-router-dom';

import { api } from '../servicios/api';
import FormularioPublicacion from '../componentes/FormularioPublicacion.jsx';

export default function Nueva() {
  const navegar = useNavigate();

  const guardar = async (datos) => {
    const creada = await api.crearPublicacion(datos);
    navegar(`/publicacion/${creada.id}`, { replace: true });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="etiqueta">Nueva publicación</p>
        <h1 className="titular text-3xl">Cuenta tu viaje</h1>
      </div>

      <FormularioPublicacion onGuardar={guardar} textoBoton="Publicar" onCancelar={() => navegar('/')} />
    </div>
  );
}
