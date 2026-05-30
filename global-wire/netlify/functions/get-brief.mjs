// ─────────────────────────────────────────────────────────────
//  FUNCION DE CONSULTA  ·  GLOBAL & WIRE
//  Funcion normal y rapida. La pagina la llama cada pocos segundos
//  para preguntar "ya esta listo el informe?". Lee el almacen
//  (Netlify Blobs) y devuelve el estado: pending / done / error.
// ─────────────────────────────────────────────────────────────

import { getStore } from "@netlify/blobs";

export default async (request) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ status: "error", error: "Falta el identificador." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const store = getStore("briefs");
    const result = await store.get(id, { type: "json" });

    if (!result) {
      // Todavia no hay nada escrito: el trabajo sigue en marcha
      return new Response(JSON.stringify({ status: "pending" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: "error", error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
