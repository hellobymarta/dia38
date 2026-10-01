// La entrada para trabajar en local: la misma aplicación, pero escuchando en
// un puerto. En producción no se usa, porque Vercel llama a index.js.
import app from './src/app.js';

const puerto = process.env.PORT || 3001;

app.listen(puerto, () => {
  console.log(`API en marcha en http://localhost:${puerto}/api/estado`);
});
