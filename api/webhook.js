// Webhook de WhatsApp (Meta Cloud API) — Taller de Carrocería y Pintura Nogales.
// Vive en Vercel como función serverless en /api/webhook.
//
// GET  -> verificación de Meta: responde el hub.challenge solo si el
//         hub.verify_token coincide con META_WEBHOOK_VERIFY_TOKEN.
// POST -> recibe los eventos de WhatsApp (mensajes, estados, etc.) y los
//         registra en los logs de Vercel. Todavía no guarda nada en la base
//         de datos ni contesta mensajes; eso es el siguiente paso.
//
// El token NUNCA va en el código: se configura como variable de entorno
// META_WEBHOOK_VERIFY_TOKEN en Vercel (producción y vista previa) y el
// mismo valor se pega en la página de Webhooks de la app de Meta.

export default function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && token && expected && token === expected) {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).send("Forbidden");
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};
    try {
      const raw = typeof body === "string" ? body : JSON.stringify(body);
      console.log("[whatsapp-webhook]", raw.slice(0, 4000));
    } catch {
      console.log("[whatsapp-webhook] (evento no serializable)");
    }
    res.status(200).send("EVENT_RECEIVED");
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).send("Method Not Allowed");
}
