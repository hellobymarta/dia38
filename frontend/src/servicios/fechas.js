const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Formateo a mano en vez de con toLocaleDateString: esa función usa el idioma y
// la zona horaria de quien la ejecuta, y en el día 33 me dejó la fecha distinta
// según dónde se pintara.
export function enTexto(fecha) {
  if (!fecha) return '';

  const dia = new Date(fecha);

  if (Number.isNaN(dia.getTime())) return '';

  return `${dia.getDate()} de ${MESES[dia.getMonth()]} de ${dia.getFullYear()}`;
}
