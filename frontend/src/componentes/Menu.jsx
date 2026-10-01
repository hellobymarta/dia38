import { Link, NavLink } from 'react-router-dom';

import { useSesion } from '../context/sesion';

export default function Menu() {
  const { usuario, haEntrado, salir } = useSesion();

  const enlace = ({ isActive }) =>
    `etiqueta border-b pb-1 transition ${
      isActive ? 'border-tinta text-tinta' : 'border-transparent hover:text-tinta'
    }`;

  return (
    <header className="border-b border-borde bg-hueso">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="etiqueta">Diario de viajes</p>
          <Link to="/" className="titular text-2xl">
            Vagamundo
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-5">
          <NavLink to="/" className={enlace} end>
            Publicaciones
          </NavLink>

          {haEntrado ? (
            <>
              <NavLink to="/nueva" className={enlace}>
                Escribir
              </NavLink>
              <span className="text-sm text-suave">{usuario.nombre}</span>
              <button type="button" className="boton-suave" onClick={salir}>
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/entrar" className={enlace}>
                Entrar
              </NavLink>
              <NavLink to="/registro" className={enlace}>
                Crear cuenta
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
