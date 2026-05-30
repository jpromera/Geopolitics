# GLOBAL & WIRE — Version 2 (corrige el error de tiempo de espera)

## Que ha cambiado y por que

La version anterior fallaba con "Unknown error" porque las funciones normales
de Netlify se cortan a los pocos segundos, y tu informe (con busqueda web)
tarda mas. Esta version usa una "funcion de fondo" que puede tardar hasta
15 minutos: la web lanza el trabajo, espera, y muestra el informe cuando
esta listo. Tu solo ves la animacion de carga.

IMPORTANTE: esta version usa el almacenamiento de Netlify, que se instala
durante el despliegue. Por eso ahora conviene desplegar CONECTANDO GITHUB
(instala todo solo). Arrastrar la carpeta a mano ya NO es lo recomendable.

---

## Que hay en la carpeta

```
global-wire/
├── index.html                          <- La pagina web
├── netlify.toml                        <- Configuracion (no tocar)
├── package.json                        <- Lista lo que Netlify debe instalar
├── INSTRUCCIONES.md                    <- Esta guia
└── netlify/
    └── functions/
        ├── generate-brief-background.mjs  <- Genera el informe (tarea de fondo)
        └── get-brief.mjs                  <- Comprueba si ya esta listo
```

---

## PASO 1 — Sube los archivos a GitHub

1. Entra en https://github.com y crea una cuenta (o inicia sesion).
2. Arriba a la derecha, pulsa el "+" -> "New repository".
3. Ponle un nombre (por ejemplo `global-wire`), dejalo en "Public" o "Private",
   y pulsa "Create repository".
4. En la pagina del repositorio vacio, pulsa el enlace
   "uploading an existing file".
5. Arrastra TODO el contenido de la carpeta `global-wire` (los archivos y la
   carpeta `netlify`). Asegurate de que `index.html` y `package.json` quedan
   en la raiz, no dentro de otra subcarpeta.
6. Abajo, pulsa "Commit changes".

---

## PASO 2 — Conecta GitHub con Netlify

1. Entra en https://app.netlify.com
2. Pulsa "Add new site" -> "Import an existing project".
3. Elige "Deploy with GitHub" y autoriza el acceso.
4. Selecciona el repositorio `global-wire` que acabas de crear.
5. En la pantalla de configuracion deja TODO como esta
   (Netlify lee el archivo netlify.toml automaticamente).
   - Build command: dejalo vacio o lo que ponga por defecto.
   - Publish directory: `.`  (un punto) o lo que aparezca.
6. Pulsa "Deploy".

Netlify instalara lo necesario y publicara la web. Tardara 1-2 minutos.

---

## PASO 3 — Anade tu API key de Anthropic

1. En Netlify, abre tu sitio -> "Site configuration" -> "Environment variables".
2. "Add a variable" -> "Add a single variable".
3. Key (nombre exacto): `ANTHROPIC_API_KEY`
4. Value: tu clave `sk-ant-...`
5. Guarda.
6. Ve a "Deploys" -> "Trigger deploy" -> "Clear cache and deploy site"
   para que las funciones tomen la clave.

---

## PASO 4 — Pruebalo

1. Abre la direccion de tu sitio.
2. Pulsa "Generate Brief".
3. Veras la animacion de carga durante 30-120 segundos (Claude busca en
   internet y redacta). Cuando termina, aparece el informe completo.

---

## Como actualizar en el futuro

Como esta conectado a GitHub, para cambiar algo solo tienes que editar el
archivo en GitHub (o volver a subirlo) y Netlify lo re-despliega solo.

Para cambiar el numero de noticias o el idioma:
- Abre `netlify/functions/generate-brief-background.mjs` en GitHub.
- `const ITEM_COUNT = 8;` -> cambia el numero.
- Busca `British English` -> cambialo por `Spanish` si lo quieres en espanol.
- Para usar el modelo mas potente: cambia `"claude-sonnet-4-6"` por
  `"claude-opus-4-8"`.

---

## Si algo falla

- "El informe esta tardando demasiado": vuelve a pulsar el boton. Si se repite,
  revisa en Netlify -> Logs -> Functions que `generate-brief-background`
  no de error (suele ser saldo agotado o la API key).
- Error de API key: repite el PASO 3 (nombre exacto ANTHROPIC_API_KEY) y
  vuelve a desplegar con "Clear cache and deploy site".

---

## Aviso
El informe es analisis geopolitico, no asesoramiento de inversion.
