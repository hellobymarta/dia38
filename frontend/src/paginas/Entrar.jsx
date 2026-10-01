import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useSesion } from '../context/sesion';
import { validarEntrada } from '../servicios/validacion';
import Aviso from '../componentes/Aviso.jsx';

export default function Entrar() {
  const { entrar } = useSesion();
  const navegar = useNavigate();
  const sitio = useLocation();

  const [datos, setDatos] = useState({ email: '', contrasena: '' });
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState('');
  const [entrando, setEntrando] = useState(false);

  const cambiar = (campo) => (evento) => {
    setDatos({ ...datos, [campo]: evento.target.value });
    setErrores({ ...errores, [campo]: undefined });
  };

  const enviar = async (evento) => {
    evento.preventDefault();

    const encontrados = validarEntrada(datos);

    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      return;
    }

    setEntrando(true);
    setAviso('');

    try {
      await entrar(datos);
      // Si venía de una pantalla privada, la devuelvo allí.
      navegar(sitio.state?.volverA || '/', { replace: true });
    } catch (fallo) {
      setAviso(fallo.message);
    } finally {
      setEntrando(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="etiqueta">Tu cuenta</p>
        <h1 className="titular text-3xl">Entrar</h1>
      </div>

      <form onSubmit={enviar} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="etiqueta" htmlFor="email">Correo</label>
          <input id="email" type="email" className="campo" value={datos.email} onChange={cambiar('email')} />
          {errores.email && <p className="text-sm text-red-700">{errores.email}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="etiqueta" htmlFor="contrasena">Contraseña</label>
          <input id="contrasena" type="password" className="campo" value={datos.contrasena} onChange={cambiar('contrasena')} />
          {errores.contrasena && <p className="text-sm text-red-700">{errores.contrasena}</p>}
        </div>

        <Aviso tipo="mal">{aviso}</Aviso>

        <button type="submit" className="boton self-start" disabled={entrando}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="text-sm text-suave">
        ¿Todavía no tienes cuenta?{' '}
        <Link to="/registro" className="underline hover:text-acento">Crear una</Link>
      </p>
    </div>
  );
}
