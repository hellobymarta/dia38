import { createContext, useContext } from 'react';

// El contexto y su hook van en un archivo aparte del proveedor: así cada
// archivo exporta una sola cosa y Vite puede recargar los componentes en
// caliente sin perder el estado.
export const SesionContext = createContext(null);

export function useSesion() {
  const valor = useContext(SesionContext);

  if (!valor) {
    throw new Error('useSesion tiene que usarse dentro de ProveedorSesion.');
  }

  return valor;
}
