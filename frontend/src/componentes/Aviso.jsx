export default function Aviso({ tipo = 'bien', children }) {
  if (!children) return null;

  const estilo =
    tipo === 'mal'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-borde bg-hueso text-tinta';

  return (
    <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${estilo}`}>
      {children}
    </p>
  );
}
