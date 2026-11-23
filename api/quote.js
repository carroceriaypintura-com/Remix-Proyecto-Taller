// Endpoint público para guardar cotizaciones del cotizador web.
// Vive en Vercel como función serverless en /api/quote.
//
// POST -> valida la solicitud, guarda la cotización en la colección
//         `quotes` de Firestore y responde con el folio. Las fotos se
//         guardan junto con la cotización (como datos en el documento),
//         porque este proyecto no tiene Firebase Storage activado (el
//         bucket no existe) ni credenciales de subida a R2; el panel
//         Taller Digital las muestra en miniatura.
//
// Las reglas publicadas de Firestore permiten crear cotizaciones sin
// iniciar sesión cuando el documento cumple la forma validada
// (isValidQuote + estado 'recibida'); la lista sigue siendo solo para
// el admin. Si algún día se publican las reglas del repositorio tal
// cual (que exigen ser admin para crear), este endpoint dejará de
// guardar: ver hallazgo 9.2 de la auditoría.
//
// Los secretos NUNCA van en el código: la configuración de Firebase de
// abajo es la configuración pública web, la misma que ya lleva el sitio
// en el navegador de cada visitante. La función es autocontenida a
// propósito: NO importa nada de src/.

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

// Servicios del cotizador (mismos ids que QuoteEstimator.tsx).
const ALLOWED_SERVICES = {
  facia: 'Fascia / Defensa',
  salpicadera: 'Salpicadera / Puerta',
  cofre: 'Cofre / Cajuela',
  pulido: 'Pulido Espejo Genesis',
  ceramico: 'Recubrimiento Cerámico 9H',
  faros: 'Restauración de Faros (Par)',
  general: 'Pintura General al Horno',
  chasis: 'Hojalatería de Colisión',
};

const MAX_BODY_BYTES = 3 * 1024 * 1024;
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 250 * 1024; // por foto, ya decodificada
const MAX_INLINE_PHOTOS_BYTES = 700 * 1024; // total de fotos en el documento
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5; // solicitudes por IP por hora (mejor esfuerzo)
const rateLimit = new Map();

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const hits = (rateLimit.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) return true;
  hits.push(now);
  rateLimit.set(ip, hits);
  return false;
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('body-too-large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function asText(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function validateQuote(body) {
  if (!body || typeof body !== 'object') return { error: 'Solicitud inválida.' };

  const clientName = asText(body.clientName, 100) || 'Cliente web';
  const clientPhone = asText(body.clientPhone, 30);
  const digits = clientPhone.replace(/\D/g, '');
  if (digits.length < 10) return { error: 'Escribe un teléfono válido de al menos 10 dígitos.' };

  const vehicle = asText(body.vehicle, 50);
  if (!vehicle) return { error: 'Escribe tu vehículo (marca, modelo y año).' };

  const serviceId = typeof body.serviceId === 'string' ? body.serviceId : '';
  const serviceName = ALLOWED_SERVICES[serviceId];
  if (!serviceName) return { error: 'Servicio no válido.' };

  const estimatedRange = asText(body.estimatedRange, 100);
  const description = asText(body.description, 1000);

  const photos = Array.isArray(body.photos) ? body.photos.slice(0, MAX_PHOTOS) : [];
  const photoData = [];
  let totalPhotoBytes = 0;
  for (const photo of photos) {
    if (!photo || typeof photo.data !== 'string') continue;
    const match = photo.data.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return { error: 'Una foto no tiene un formato válido (solo JPG, PNG o WebP).' };
    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length > MAX_PHOTO_BYTES) return { error: 'Una foto es demasiado grande.' };
    totalPhotoBytes += bytes.length;
    if (totalPhotoBytes > MAX_INLINE_PHOTOS_BYTES) {
      return { error: 'Las fotos juntas son demasiado grandes.' };
    }
    photoData.push(photo.data);
  }

  return {
    value: {
      clientName,
      clientPhone,
      vehicle,
      serviceId,
      serviceName,
      estimatedRange,
      description,
      photoData,
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'Método no permitido.' });
    return;
  }

  if (isRateLimited(clientIp(req))) {
    res.status(429).json({ ok: false, error: 'Demasiadas solicitudes. Inténtalo más tarde.' });
    return;
  }

  let raw;
  try {
    raw = await readBody(req);
  } catch {
    res.status(413).json({ ok: false, error: 'La solicitud es demasiado grande.' });
    return;
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    res.status(400).json({ ok: false, error: 'Solicitud inválida.' });
    return;
  }

  const checked = validateQuote(body);
  if (checked.error) {
    res.status(400).json({ ok: false, error: checked.error });
    return;
  }
  const q = checked.value;

  const quoteId = 'cot-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  try {
    await setDoc(doc(db, 'quotes', quoteId), {
      id: quoteId,
      clientName: q.clientName,
      clientPhone: q.clientPhone,
      clientEmail: '',
      vehicleMake: '',
      vehicleModel: q.vehicle,
      vehicleYear: '',
      serviceType: q.serviceName,
      description: q.description,
      estimatedRange: q.estimatedRange,
      status: 'recibida',
      userId: 'web',
      photoUrls: [],
      photoData: q.photoData,
      photoCount: q.photoData.length,
      photoStorage: q.photoData.length > 0 ? 'inline' : 'none',
      source: 'web',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('[api/quote] Error guardando cotización:', err);
    res.status(500).json({ ok: false, error: 'No se pudo guardar tu solicitud. Inténtalo de nuevo.' });
    return;
  }

  console.log(`[api/quote] Cotización ${quoteId} guardada (${q.photoData.length} foto(s))`);
  res.status(200).json({
    ok: true,
    quoteId,
    photoCount: q.photoData.length,
    photoStorage: q.photoData.length > 0 ? 'inline' : 'none',
  });
}
