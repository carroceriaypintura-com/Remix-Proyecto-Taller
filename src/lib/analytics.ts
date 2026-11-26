// Eventos de conversión: Meta Pixel y GA4 (a través de GTM).
// La medición nunca debe romper el sitio: si el Pixel o el dataLayer
// no están cargados, estas funciones simplemente no hacen nada.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function pushDataLayer(event: Record<string, unknown>) {
  try {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event);
  } catch {
    // La medición nunca debe romper el sitio.
  }
}

function trackFbq(eventName: string, params?: Record<string, unknown>) {
  try {
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
    window.fbq('track', eventName, params);
  } catch {
    // La medición nunca debe romper el sitio.
  }
}

/** El visitante envió una cotización desde el cotizador. */
export function trackLead(serviceId: string, valueMxn: number) {
  trackFbq('Lead', { content_name: serviceId, value: valueMxn, currency: 'MXN' });
  pushDataLayer({ event: 'generate_lead', service: serviceId, value: valueMxn, currency: 'MXN' });
}

/** El visitante tocó un botón de WhatsApp. `source` indica desde dónde. */
export function trackWhatsAppClick(source: string) {
  trackFbq('Contact', { content_name: `whatsapp_${source}` });
  pushDataLayer({ event: 'whatsapp_click', source });
}
