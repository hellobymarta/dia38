import { Navigate, useLocation } from 'react-router-dom';

import { useSesion } from '../context/sesion';

// Envuelve las pantallas que piden sesión. Mientras se comprueba el token
// guardado no decido nada: si redirigiera ya, al recargar una página privada
// saldría disparada al formulario de entrada aunque la sesión fuese buena.
export default function RutaPrivada({ children }) {
  const { haEntrado, comprobando } = useSesion();
  const sitio = useLocation();

  if (comprobando) return <p className="text-sm text-suave">Un momento…</p>;

  if (!haEntrado) return <Navigate to="/entrar" state={{ volverA: sitio.pathname }} replace />;

  return children;
}
