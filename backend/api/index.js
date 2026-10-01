// La entrada que usa Vercel: la aplicación de Express montada como función.
// Tiene que estar dentro de una carpeta llamada api para que Vercel la
// reconozca, y vercel.json manda aquí todas las direcciones.
import app from '../src/app.js';

export default app;
