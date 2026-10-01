# Día 38 — El diario de viajes de Vagamundo

Un blog con cuentas de usuario. Cualquiera puede leer las crónicas y sus
comentarios; para escribir, comentar o corregir hay que entrar. Cada persona
manda solo sobre lo suyo.

El proyecto son dos aplicaciones separadas, cada una con su despliegue:

| Carpeta  | Qué es                                                |
| ---------- | ------------------------------------------------------- |
| `backend/`  | La API: Express, Mongoose y JWT                       |
| `frontend/` | La web: React con Vite, Tailwind y React Router        |

## Tecnologías

**La API**: Node, Express 5, Mongoose 9 sobre MongoDB Atlas, JSON Web Tokens
para la sesión y bcrypt para las contraseñas.

**La web**: React 19 con Vite, React Router 7, Tailwind CSS 4 y la Context API
de React para el estado de la sesión.

## Cómo ejecutarlo

Hacen falta dos terminales, una para cada parte.

### La API

```bash
cd backend
npm install
cp .env.example .env      # y dentro, la cadena de Atlas y el secreto del token
npm run comprobar-db      # comprueba que la conexión va
npm run sembrar           # deja cuatro crónicas de ejemplo
npm run dev               # queda escuchando en el puerto 3001
```

`.env` necesita tres cosas:

| Variable       | Para qué                                                        |
| ---------------- | ----------------------------------------------------------------- |
| `MONGODB_URI`    | La cadena de conexión de Atlas                                   |
| `JWT_SECRETO`    | Con esto se firman los tokens. Una frase larga, distinta en cada sitio |
| `CORS_ORIGEN`    | Qué direcciones pueden llamar a la API, separadas por comas      |

### La web

```bash
cd frontend
npm install
cp .env.example .env.local   # y dentro, la dirección de la API
npm run dev                  # queda escuchando en el puerto 5173
```

`VITE_API_URL` apunta a `http://localhost:3001` en local y al despliegue de la
API en producción.

Para probar la API sin abrir el navegador, con el servidor levantado:

```bash
cd backend
npm run probar
```

Registra dos cuentas, publica, comenta, intenta tocar lo ajeno y lo borra todo
al terminar.

## La API

| Endpoint                            | Método   | Quién puede        |
| ------------------------------------- | ---------- | -------------------- |
| `/api/auth/registro`                  | `POST`     | Cualquiera          |
| `/api/auth/entrar`                    | `POST`     | Cualquiera          |
| `/api/auth/yo`                        | `GET`      | Con sesión          |
| `/api/publicaciones`                  | `GET`      | Cualquiera          |
| `/api/publicaciones`                  | `POST`     | Con sesión          |
| `/api/publicaciones/:id`              | `GET`      | Cualquiera          |
| `/api/publicaciones/:id`              | `PUT`      | Solo quien la escribió |
| `/api/publicaciones/:id`              | `DELETE`   | Solo quien la escribió |
| `/api/publicaciones/:id/comentarios`  | `POST`     | Con sesión          |
| `/api/comentarios/:id`                | `PUT`      | Solo quien lo escribió |
| `/api/comentarios/:id`                | `DELETE`   | Solo quien lo escribió |

El listado devuelve cada publicación con sus comentarios dentro, para que la
portada se pinte con una sola petición.

## Cómo funciona la sesión

Al entrar, la API devuelve un token firmado con `JWT_SECRETO` que caduca a los
siete días. El navegador lo guarda en `localStorage` y lo manda en la cabecera
`Authorization` de cada petición.

En las rutas protegidas, `exigirSesion` abre el token, busca a esa persona y la
deja en `peticion.usuario`. Si falta, está caducado o no es nuestro, corta con
un 401 y la ruta ni se ejecuta.

Al abrir la web no me fío del token guardado: se lo paso a `/api/auth/yo`, que
es quien sabe si sigue valiendo. Si no, se borra y la sesión se cierra sola.

Las contraseñas se guardan cifradas con bcrypt y el campo lleva
`select: false`, así no sale en las consultas a menos que lo pida a propósito.
Cuando alguien se equivoca al entrar, el mensaje es el mismo tanto si el correo
no existe como si la contraseña no es la buena, para que nadie pueda averiguar
qué correos están registrados.

## Las fotografías

Van dentro del documento de Mongo en Base64, como pide el enunciado. Una foto de
móvil son varios megas, así que antes de convertirla la encojo en el navegador
con un canvas: la dibujo a 1200 píxeles como mucho y la vuelvo a sacar en JPEG,
bajando la calidad hasta que baja de 1,5 MB. Si mandara el archivo tal cual, la
API lo rechazaría.

Guardar las imágenes así es lo que hace que la lista esté paginada: cada
publicación arrastra su foto entera, y traerlas todas de golpe sería lentísimo.

## Validaciones

Las reglas están escritas dos veces a propósito: en `frontend/src/servicios` para
avisar sin esperar a la red, y en `backend/src/validacion.js`, que es la que manda,
porque a los endpoints se les puede escribir desde fuera del formulario.

| Situación                          | Código |
| ------------------------------------ | -------- |
| Todo bien                           | `200`    |
| Creado                              | `201`    |
| Falta un campo o está mal           | `400`    |
| Sin sesión, o el token no vale      | `401`    |
| La cosa existe pero no es tuya      | `403`    |
| No existe                           | `404`    |
| La foto pesa demasiado              | `413`    |
| La base de datos no contesta        | `503`    |

## Paginación

El listado va de seis en seis. El número de página viaja en la dirección
(`/?pagina=2`), no en el estado del componente, así se puede compartir el enlace
y el botón de atrás del navegador funciona.

## Despliegue

Son dos proyectos de Vercel sobre el mismo repositorio, cambiando el
**Root Directory**: uno apunta a `backend` y el otro a `frontend`.

En el proyecto de la API hacen falta `MONGODB_URI`, `JWT_SECRETO` y
`CORS_ORIGEN` con la dirección del frontend. En el del frontend, `VITE_API_URL`
con la dirección de la API. Vercel lee las variables al construir, así que
después de cambiarlas hay que volver a desplegar.

En Atlas, *Network Access* tiene que dejar entrar a las funciones de Vercel, que
no tienen una IP fija.

## Estructura

```
dia38/
├── backend/
│   ├── api/index.js             ← la entrada de Vercel
│   ├── servidor.js              ← la entrada en local
│   ├── vercel.json
│   ├── scripts/
│   │   ├── comprobar-db.mjs
│   │   ├── sembrar.mjs
│   │   ├── probar.mjs
│   │   └── semilla/             ← las fotos de las crónicas de ejemplo
│   └── src/
│       ├── app.js               ← Express, CORS y el manejo de errores
│       ├── db.js                ← la conexión con Atlas, cacheada
│       ├── auth.js              ← firmar y comprobar los tokens
│       ├── validacion.js
│       ├── modelos/             ← Usuario, Publicacion, Comentario
│       └── rutas/               ← auth, publicaciones, comentarios
└── frontend/
    ├── vercel.json
    └── src/
        ├── App.jsx              ← las rutas
        ├── context/             ← el contexto de la sesión
        ├── servicios/           ← las llamadas a la API y las validaciones
        ├── componentes/
        └── paginas/
```
