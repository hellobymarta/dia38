export default function Paginacion({ pagina, paginas, onCambiar }) {
  if (paginas <= 1) return null;

  const numeros = Array.from({ length: paginas }, (uno, posicion) => posicion + 1);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 pt-4">
      <button
        type="button"
        className="boton-suave"
        disabled={pagina === 1}
        onClick={() => onCambiar(pagina - 1)}
      >
        Anterior
      </button>

      {numeros.map((numero) => (
        <button
          key={numero}
          type="button"
          onClick={() => onCambiar(numero)}
          aria-current={numero === pagina ? 'page' : undefined}
          className={`boton-suave ${numero === pagina ? 'border-tinta' : ''}`}
        >
          {numero}
        </button>
      ))}

      <button
        type="button"
        className="boton-suave"
        disabled={pagina === paginas}
        onClick={() => onCambiar(pagina + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
}
