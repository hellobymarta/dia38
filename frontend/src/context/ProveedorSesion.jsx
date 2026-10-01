import { useEffect, useMemo, useState } from 'react';

import { SesionContext } from './sesion';
import { api, guardarToken, leerToken } from '../servicios/api';

// El estado global de la sesión. Lo pongo en un contexto para que cualquier
// pantalla sepa quién ha entrado sin ir pasando el usuario de padre a hijo.
//
// El token se guarda en localStorage para que la sesión siga abierta al cerrar
// el navegador. Al arrancar no me fío de lo que hay guardado: se lo pregunto a
// la API, que es quien sabe si sigue valiendo o ha caducado.

export function ProveedorSesion({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [comprobando, setComprobando] = useState(Boolean(leerToken()));

  useEffect(() => {
    if (!leerToken()) return;

    api
      .yo()
      .then(({ usuario: suyo }) => setUsuario(suyo))
      .catch(() => {
        guardarToken(null);
        setUsuario(null);
      })
      .finally(() => setComprobando(false));
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      comprobando,
      haEntrado: Boolean(usuario),

      async entrar(datos) {
        const { token, usuario: suyo } = await api.entrar(datos);
        guardarToken(token);
        setUsuario(suyo);
      },

      async registrar(datos) {
        const { token, usuario: suyo } = await api.registro(datos);
        guardarToken(token);
        setUsuario(suyo);
      },

      salir() {
        guardarToken(null);
        setUsuario(null);
      },

      // Para saber si algo lo ha escrito quien está mirando la pantalla.
      esMio: (cosa) => Boolean(usuario) && cosa?.autor?.id === usuario.id,
    }),
    [usuario, comprobando]
  );

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}
