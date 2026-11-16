// Webhook de WhatsApp (Meta Cloud API) — Taller de Carrocería y Pintura Nogales.
// Vive en Vercel como función serverless en /api/webhook.
//
// GET  -> verificación de Meta: responde el hub.challenge solo si el
//         hub.verify_token coincide con META_WEBHOOK_VERIFY_TOKEN.
// POST -> recibe los eventos de WhatsApp. Verifica la firma de Meta
//         (X-Hub-Signature-256 con META_APP_SECRET) cuando el secreto está
//         configurado, y guarda cada mensaje entrante en la colección
//         `whatsapp_messages` de Firestore para verlo en el panel
//         Taller Digital (/administracion). No contesta mensajes.
//
// Los secretos NUNCA van en el código: se configuran como variables de
// entorno en Vercel. META_WEBHOOK_VERIFY_TOKEN va en producción y vista
// previa; META_APP_SECRET solo en producción (la vista previa queda sin
// verificar firma para poder probarla con un POST de prueba).

import crypto from 'node:crypto';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// La función es autocontenida a propósito: NO importa nada de src/.
// (Importar src/lib/firebase.ts rompía el despliegue en Vercel: el
// transpilado busca './adminPolicy' sin extensión y el módulo no existe
// en la función.) La configuración de abajo es la configuración pública
// web de Firebase, los mismos valores de firebase-applet-config.json que
// ya lleva el sitio en el navegador de cada visitante.
const firebaseConfig = {
  apiKey: 'AIzaSyBP55pega3FDIoh3SXk2fVMX-cEQnwb72c',
  authDomain: 'taller-de-carroceria-y-pintura.firebaseapp.com',
  projectId: 'taller-de-carroceria-y-pintura',
  storageBucket: 'taller-de-carroceria-y-pintura.firebasestorage.app',
  messagingSenderId: '824347434506',
  appId: '1:824347434506:web:af9a66e0e0f80d291989f3',
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'ai-studio-remixremixremixp-2f705343-c737-41b5-bf0c-61e86a186964');

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// Meta firma cada POST con HMAC-SHA256 del cuerpo usando el secreto de la app.
// Sin el secreto configurado (vista previa) se acepta el evento y se avisa
// en el log; en producción el secreto siempre debe estar configurado.
function verifySignature(rawBody, signature) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    console.warn('[whatsapp-webhook] META_APP_SECRET no configurado: evento aceptado sin verificar firma');
    return true;
  }
  if (!signature) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const NON_TEXT_LABELS = {
  image: '[imagen]',
  audio: '[audio]',
  video: '[video]',
  document: '[documento]',
  sticker: '[sticker]',
  location: '[ubicación]',
  contacts: '[contacto]',
  reaction: '[reacción]',
};

function messageText(msg) {
  const type = msg?.type || 'unknown';
  if (type === 'text') return msg.text?.body || '';
  if (msg?.[type]?.caption) return msg[type].caption;
  return NON_TEXT_LABELS[type] || `[mensaje de ${type}]`;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && token && expected && token === expected) {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).send('Forbidden');
    return;
  }

  if (req.method === 'POST') {
    let rawBody;
    try {
      rawBody = await readRawBody(req);
    } catch {
      res.status(400).send('Bad Request');
      return;
    }
    if (!verifySignature(rawBody, req.headers['x-hub-signature-256'])) {
      res.status(401).send('Unauthorized');
      return;
    }
    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      res.status(400).send('Bad Request');
      return;
    }

    let saved = 0;
    try {
      const entries = Array.isArray(payload?.entry) ? payload.entry : [];
      for (const entry of entries) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        for (const change of changes) {
          const messages = Array.isArray(change?.value?.messages) ? change.value.messages : [];
          for (const msg of messages) {
            const wamid = typeof msg?.id === 'string' ? msg.id : null;
            const from = typeof msg?.from === 'string' ? msg.from : null;
            if (!wamid || !from) continue;
            const ref = doc(db, 'whatsapp_messages', wamid);
            // Meta puede reintentar un evento: si ya existe, no duplicarlo
            // (y no pisar el estado que Diego ya le haya puesto).
            const existing = await getDoc(ref);
            if (existing.exists()) continue;
            await setDoc(ref, {
              id: wamid,
              wamid,
              from,
              type: typeof msg.type === 'string' ? msg.type : 'unknown',
              text: String(messageText(msg)).slice(0, 2000),
              timestamp: Number(msg.timestamp) || Math.floor(Date.now() / 1000),
              status: 'nuevo',
              receivedAt: serverTimestamp(),
            });
            saved++;
          }
        }
      }
    } catch (err) {
      console.error('[whatsapp-webhook] Error guardando mensajes:', err);
    }
    console.log(`[whatsapp-webhook] ${saved} mensaje(s) guardado(s)`);
    res.status(200).send('EVENT_RECEIVED');
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).send('Method Not Allowed');
}
