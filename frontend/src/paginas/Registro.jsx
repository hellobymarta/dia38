import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useSesion } from '../context/sesion';
import { validarRegistro } from '../servicios/validacion';
import Aviso from '../componentes/Aviso.jsx';

export default function Registro() {
  const { registrar } = useSesion();
  const navegar = useNavigate();

  const [datos, setDatos] = useState({ nombre: '', email: '', contrasena: '' });
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState('');
  const [creando, setCreando] = useState(false);

  const cambiar = (campo) => (evento) => {
    setDatos({ ...datos, [campo]: evento.target.value });
    setErrores({ ...errores, [campo]: undefined });
  };

  const enviar = async (evento) => {
    evento.preventDefault();

    const encontrados = validarRegistro(datos);

    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      return;
    }

    setCreando(true);
    setAviso('');

    try {
      await registrar(datos);
      navegar('/', { replace: true });
    } catch (fallo) {
      setAviso(fallo.message);
      if (fallo.errores) setErrores(fallo.errores);
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="etiqueta">Tu cuenta</p>
        <h1 className="titular text-3xl">Crear cuenta</h1>
      </div>

      <form onSubmit={enviar} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="etiqueta" htmlFor="nombre">Nombre</label>
          <input id="nombre" className="campo" value={datos.nombre} onChange={cambiar('nombre')} />
          {errores.nombre && <p className="text-sm text-red-700">{errores.nombre}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="etiqueta" htmlFor="email">Correo</label>
          <input id="email" type="email" className="campo" value={datos.email} onChange={cambiar('email')} />
          {errores.email && <p className="text-sm text-red-700">{errores.email}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="etiqueta" htmlFor="contrasena">Contraseña</label>
          <input id="contrasena" type="password" className="campo" value={datos.contrasena} onChange={cambiar('contrasena')} />
          {errores.contrasena ? (
            <p className="text-sm text-red-700">{errores.contrasena}</p>
          ) : (
            <p className="text-sm text-suave">Ocho caracteres como mínimo.</p>
          )}
        </div>

        <Aviso tipo="mal">{aviso}</Aviso>

        <button type="submit" className="boton self-start" disabled={creando}>
          {creando ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="text-sm text-suave">
        ¿Ya tienes cuenta?{' '}
        <Link to="/entrar" className="underline hover:text-acento">Entrar</Link>
      </p>
    </div>
  );
}
