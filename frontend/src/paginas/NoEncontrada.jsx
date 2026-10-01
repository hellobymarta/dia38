import { Link } from 'react-router-dom';

export default function NoEncontrada() {
  return (
    <div className="flex flex-col gap-4">
      <p className="etiqueta">Error 404</p>
      <h1 className="titular text-4xl">Esta página no existe</h1>
      <p className="text-suave">Puede que el enlace esté mal escrito o que la página ya no esté.</p>
      <Link to="/" className="self-start underline hover:text-acento">Volver al diario</Link>
    </div>
  );
}
