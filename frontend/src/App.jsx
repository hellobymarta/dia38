import { Route, Routes } from 'react-router-dom';

import Menu from './componentes/Menu.jsx';
import RutaPrivada from './componentes/RutaPrivada.jsx';
import Listado from './paginas/Listado.jsx';
import Detalle from './paginas/Detalle.jsx';
import Entrar from './paginas/Entrar.jsx';
import Registro from './paginas/Registro.jsx';
import Nueva from './paginas/Nueva.jsx';
import Editar from './paginas/Editar.jsx';
import NoEncontrada from './paginas/NoEncontrada.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Menu />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <Routes>
          <Route path="/" element={<Listado />} />
          <Route path="/publicacion/:id" element={<Detalle />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/registro" element={<Registro />} />
          <Route
            path="/nueva"
            element={
              <RutaPrivada>
                <Nueva />
              </RutaPrivada>
            }
          />
          <Route
            path="/editar/:id"
            element={
              <RutaPrivada>
                <Editar />
              </RutaPrivada>
            }
          />
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>

      <footer className="mx-auto w-full max-w-3xl px-6 pb-10">
        <p className="text-sm text-suave">Vagamundo · hola@vagamundo.es</p>
        <p className="text-sm text-suave">Práctica del día 38 · Desarrollo Web Fullstack</p>
      </footer>
    </div>
  );
}
