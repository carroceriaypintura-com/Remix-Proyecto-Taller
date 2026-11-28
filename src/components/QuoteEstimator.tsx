import { useState, useId, useEffect } from 'react';
import { Wrench, Upload, Trash2, MessageCircle, Sparkles, Check, AlertTriangle, RotateCcw } from 'lucide-react';
import { Language } from '../types';
import { BUSINESS_INFO } from '../data/content';
import { trackLead } from '../lib/analytics';
import { subscribeToSiteContent, findServiceOverride, SiteContentOverride } from '../lib/siteContent';

interface QuoteEstimatorProps {
  lang: Language;
}

export const COMMON_SERVICES = [
  { id: 'facia', nameEs: 'Fascia / Defensa', nameEn: 'Bumper Repair & Paint', minMxn: 1800, maxMxn: 2600, badge: 'Popular' },
  { id: 'salpicadera', nameEs: 'Salpicadera / Puerta', nameEn: 'Fender / Door Repair', minMxn: 1700, maxMxn: 2400 },
  { id: 'cofre', nameEs: 'Cofre / Cajuela', nameEn: 'Hood / Trunk Panel', minMxn: 2200, maxMxn: 3200 },
  { id: 'pulido', nameEs: 'Pulido Espejo Genesis', nameEn: 'Mirror Polish Detailing', minMxn: 1500, maxMxn: 2800, badge: 'Genesis' },
  { id: 'ceramico', nameEs: 'Recubrimiento Cerámico 9H', nameEn: '9H Ceramic Coating', minMxn: 3500, maxMxn: 5500 },
  { id: 'faros', nameEs: 'Restauración de Faros (Par)', nameEn: 'Headlight Restoration', minMxn: 700, maxMxn: 1000 },
  { id: 'general', nameEs: 'Pintura General', nameEn: 'Complete Repaint', minMxn: 16000, maxMxn: 26000 },
  { id: 'chasis', nameEs: 'Hojalatería de Colisión', nameEn: 'Collision Bodywork', minMxn: 3000, maxMxn: 6500 },
];

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 250 * 1024;

interface AttachedPhoto {
  file: File;
  preview: string;
}

interface SentQuote {
  quoteId: string | null;
  whatsappUrl: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer la foto.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la foto.'));
    img.src = src;
  });
}

// Reduce la foto a un tamaño apto para guardarla junto con la cotización
// (máx. 1000 px por el lado mayor, JPEG). Una foto de celular de 12 MP
// queda normalmente entre 80 y 180 KB después de este paso.
async function downscalePhoto(file: File): Promise<string> {
  const src = await fileToDataUrl(file);
  const img = await loadImage(src);
  const maxDim = 1000;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la foto.');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.75);
}

export default function QuoteEstimator({ lang }: QuoteEstimatorProps) {
  const photoInputId = useId();
  const [selectedService, setSelectedService] = useState<string>('facia');
  const [vehicleModel, setVehicleModel] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [damageNotes, setDamageNotes] = useState('');
  const [attachedPhotos, setAttachedPhotos] = useState<AttachedPhoto[]>([]);
  const [errors, setErrors] = useState<{ vehicle?: string; phone?: string; photos?: string }>({});
  const [sending, setSending] = useState(false);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [sent, setSent] = useState<SentQuote | null>(null);
  // Precios editados desde el panel de administración (site_content/general).
  // Si no hay nada guardado o la lectura falla, se usan los precios fijos.
  const [contentOverride, setContentOverride] = useState<SiteContentOverride | null>(null);
  useEffect(() => subscribeToSiteContent(setContentOverride), []);
  const services = COMMON_SERVICES.map((s) => {
    const o = findServiceOverride(contentOverride?.services, s.id);
    if (!o) return s;
    return {
      ...s,
      nameEs: o.title ?? s.nameEs,
      minMxn: o.minMxn ?? s.minMxn,
      maxMxn: o.maxMxn ?? s.maxMxn,
    };
  });
  const activeService = services.find((s) => s.id === selectedService) || services[0];
  const usdMin = Math.round(activeService.minMxn / 18.5);
  const usdMax = Math.round(activeService.maxMxn / 18.5);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const room = MAX_PHOTOS - attachedPhotos.length;
    if (room <= 0) {
      setErrors((prev) => ({ ...prev, photos: lang === 'es' ? `Máximo ${MAX_PHOTOS} fotos por cotización.` : `Maximum ${MAX_PHOTOS} photos per quote.` }));
      e.target.value = '';
      return;
    }
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) {
      setErrors((prev) => ({ ...prev, photos: lang === 'es' ? `Solo se tomaron las primeras ${MAX_PHOTOS} fotos.` : `Only the first ${MAX_PHOTOS} photos were kept.` }));
    } else {
      setErrors((prev) => ({ ...prev, photos: undefined }));
    }
    const added: AttachedPhoto[] = picked.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setAttachedPhotos((prev) => [...prev, ...added]);
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    setAttachedPhotos((prev) => {
      const removed = prev[idx];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSendWhatsApp = async () => {
    if (sending || sent) return;
    setSaveWarning(null);
    setPopupBlocked(false);

    const nextErrors: { vehicle?: string; phone?: string } = {};
    const vehicle = vehicleModel.trim();
    if (!vehicle) {
      nextErrors.vehicle = lang === 'es' ? 'Escribe tu vehículo (marca, modelo y año).' : 'Enter your vehicle (make, model and year).';
    } else if (vehicle.length > 50) {
      nextErrors.vehicle = lang === 'es' ? 'El vehículo debe tener 50 caracteres o menos.' : 'Vehicle must be 50 characters or fewer.';
    }
    const phoneDigits = clientPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      nextErrors.phone = lang === 'es' ? 'Escribe un teléfono válido de al menos 10 dígitos.' : 'Enter a valid phone number with at least 10 digits.';
    }
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    if (nextErrors.vehicle || nextErrors.phone) return;

    setSending(true);
    let quoteId: string | null = null;
    let photoCount = 0;
    try {
      // Reducir las fotos antes de enviarlas para que quepan en la solicitud.
      const photoData: string[] = [];
      let skippedPhotos = 0;
      for (const photo of attachedPhotos) {
        try {
          const dataUrl = await downscalePhoto(photo.file);
          const approxBytes = Math.round((dataUrl.length * 3) / 4);
          if (approxBytes > MAX_PHOTO_BYTES) {
            skippedPhotos += 1;
            continue;
          }
          photoData.push(dataUrl);
        } catch {
          skippedPhotos += 1;
        }
      }
      if (skippedPhotos > 0) {
        setErrors((prev) => ({
          ...prev,
          photos: lang === 'es'
            ? `${skippedPhotos} foto(s) no se pudieron adjuntar por su tamaño.`
            : `${skippedPhotos} photo(s) could not be attached because of their size.`,
        }));
      }
      photoCount = photoData.length;

      // Guardar la cotización en el sistema ANTES de abrir WhatsApp.
      // Si el guardado falla, no se bloquea el envío: se avisa y se
      // sigue a WhatsApp con los datos.
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          vehicle,
          serviceId: activeService.id,
          estimatedRange: `$${activeService.minMxn.toLocaleString()} - $${activeService.maxMxn.toLocaleString()} MXN`,
          description: damageNotes.trim(),
          photos: photoData.map((data, i) => ({ name: attachedPhotos[i]?.file.name || `foto-${i + 1}.jpg`, data })),
        }),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.ok) {
        quoteId = result.quoteId as string;
      } else {
        setSaveWarning(
          lang === 'es'
            ? 'No se pudo guardar tu solicitud en el sistema, pero puedes enviarla por WhatsApp con el botón de abajo.'
            : 'Your request could not be saved in our system, but you can still send it via WhatsApp with the button below.'
        );
      }
    } catch {
      setSaveWarning(
        lang === 'es'
          ? 'No se pudo guardar tu solicitud en el sistema, pero puedes enviarla por WhatsApp con el botón de abajo.'
          : 'Your request could not be saved in our system, but you can still send it via WhatsApp with the button below.'
      );
    }

    const photoLine =
      photoCount > 0
        ? `\n*Fotos:* ${photoCount} foto(s) adjunta(s) en la solicitud web, visibles en el panel del taller.`
        : '';
    const text =
`*SOLICITUD DE VALORACIÓN - CARROCERÍA Y PINTURA NOGALES*
---------------------------------------${quoteId ? `\n*Folio web:* ${quoteId}` : ''}
*Cliente:* ${clientName.trim() || 'Cliente web'}
*Teléfono:* ${clientPhone.trim()}
*Servicio solicitado:* ${activeService.nameEs}
*Vehículo:* ${vehicle}
*Estimado orientativo:* $${activeService.minMxn.toLocaleString()} - $${activeService.maxMxn.toLocaleString()} MXN (Aprox. $${usdMin} - $${usdMax} USD)
Precio final sujeto a revisión física del vehículo.
*Detalles:* ${damageNotes.trim() || 'Sin notas'}${photoLine}
---------------------------------------
_Hola, envío mis datos para una valoración personalizada de mi auto en José Zazueta #16, Los Encinos._`;

    const url = `https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(text)}`;
    const opened = window.open(url, '_blank');
    if (!opened) setPopupBlocked(true);
    trackLead(activeService.id, activeService.minMxn);
    setSent({ quoteId, whatsappUrl: url });
    setSending(false);
  };

  const resetForm = () => {
    attachedPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
    setAttachedPhotos([]);
    setVehicleModel('');
    setClientName('');
    setClientPhone('');
    setDamageNotes('');
    setErrors({});
    setSaveWarning(null);
    setPopupBlocked(false);
    setSent(null);
  };

  const inputErrorClass = 'border-rose-500/70';

  return (
    <section id="cotizador" className="py-8 sm:py-12 bg-[#12141c]/80 border-b border-white/5 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'es' ? 'Presupuesto Rápido Online' : 'Quick Online Estimate'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-3">
            {lang === 'es' ? 'Calcula tu Cotización al Instante' : 'Instant Repair Cost Estimator'}
          </h2>
          <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
            {lang === 'es'
              ? 'Elige el trabajo necesario y envía los detalles directo a nuestro WhatsApp para darte respuesta inmediata.'
              : 'Select your needed service and send the details directly to our WhatsApp for immediate attention.'}
          </p>
        </div>

        {/* Solid Slate Card #1a1d26 (No glassmorphism, rounded-2xl, soft shadow) */}
        <div className="relative rounded-2xl bg-[#1a1d26] border border-white/5 p-4 sm:p-7 space-y-7 shadow-md">
          
          {/* Confirmation after sending */}
          {sent && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5 space-y-3" role="status">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-sm sm:text-base font-bold text-white">
                    {lang === 'es' ? '¡Solicitud enviada!' : 'Request sent!'}
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-300 mt-1 leading-relaxed">
                    {lang === 'es'
                      ? 'Tu solicitud quedó registrada y se abrió WhatsApp con tus datos. Te contestamos por WhatsApp.'
                      : 'Your request was registered and WhatsApp opened with your details. We will reply on WhatsApp.'}
                  </p>
                  {sent.quoteId && (
                    <p className="text-xs text-emerald-300 font-semibold mt-1">
                      {lang === 'es' ? 'Folio web:' : 'Web reference:'} {sent.quoteId}
                    </p>
                  )}
                </div>
              </div>
              {saveWarning && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{saveWarning}</span>
                </div>
              )}
              {popupBlocked && (
                <a
                  href={sent.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-pill action-green w-full"
                >
                  <MessageCircle className="w-4 h-4 fill-neutral-950" />
                  <span>{lang === 'es' ? 'Abrir WhatsApp con mis datos' : 'Open WhatsApp with my details'}</span>
                </a>
              )}
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-300 hover:text-white underline underline-offset-4 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {lang === 'es' ? 'Hacer otra cotización' : 'Start another quote'}
              </button>
            </div>
          )}

          {/* Step 1: Select Service */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {lang === 'es' ? '1. Selecciona el servicio a reparar' : '1. Select service needed'}
              </label>
              <span className="text-[11px] text-neutral-400">
                {lang === 'es' ? 'Toca una opción' : 'Tap an option'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {services.map((s) => {
                const isSelected = selectedService === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedService(s.id)}
                    aria-pressed={isSelected}
                    className={`p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-amber-400 border-amber-200 text-black font-bold ring-2 ring-amber-200'
                        : 'bg-indigo-800 border-indigo-400/40 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {s.badge && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-neutral-950">
                        {s.badge}
                      </span>
                    )}
                    <Wrench aria-hidden="true" className="w-4 h-4 mb-2" />
                    <div className="font-medium text-xs mt-1 leading-relaxed">
                      {lang === 'es' ? s.nameEs : s.nameEn}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Car model + Photos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-200 uppercase tracking-wider mb-2">
                {lang === 'es' ? '2. Tu Vehículo (Marca / Modelo / Año)' : '2. Vehicle (Make / Model / Year)'}
              </label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => { setVehicleModel(e.target.value); setErrors((prev) => ({ ...prev, vehicle: undefined })); }}
                placeholder={lang === 'es' ? 'Ej: Silverado 2021, Civic 2020...' : 'e.g. Ford F150 2021, Civic...'}
                aria-invalid={Boolean(errors.vehicle)}
                className={`w-full px-4 py-3 bg-[#12141c] border rounded-2xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors shadow-inner ${errors.vehicle ? inputErrorClass : 'border-white/10'}`}
              />
              {errors.vehicle && <p className="text-[11px] text-rose-400 mt-1.5">{errors.vehicle}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-200 uppercase tracking-wider mb-2">
                {lang === 'es' ? '3. Fotos del Golpe o Detalle (Opcional)' : '3. Photos of Damage (Optional)'}
              </label>
              <div className="flex items-center gap-2">
                <label
                  htmlFor={photoInputId}
                  className="action-pill action-purple"
                >
                  <Upload className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'es' ? 'Adjuntar Fotos del Auto' : 'Attach Vehicle Photos'}</span>
                </label>
                <input
                  id={photoInputId}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                {attachedPhotos.length > 0 && (
                  <span className="text-xs text-amber-400 font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                    {attachedPhotos.length} {lang === 'es' ? 'foto(s)' : 'photo(s)'}
                  </span>
                )}
              </div>
              {errors.photos && <p className="text-[11px] text-amber-400 mt-1.5">{errors.photos}</p>}
            </div>
          </div>

          {/* Step 3: Optional contact details for WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-neutral-200 uppercase tracking-wider mb-2">
                {lang === 'es' ? 'Tu Nombre (Para el presupuesto)' : 'Your Name'}
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej: Carlos Ramírez"
                className="w-full px-4 py-2.5 bg-[#12141c] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-200 uppercase tracking-wider mb-2">
                {lang === 'es' ? 'Teléfono o WhatsApp' : 'Phone or WhatsApp'}
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => { setClientPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: undefined })); }}
                placeholder="Ej: (631) 123-4567"
                aria-invalid={Boolean(errors.phone)}
                className={`w-full px-4 py-2.5 bg-[#12141c] border rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors ${errors.phone ? inputErrorClass : 'border-white/10'}`}
              />
              {errors.phone && <p className="text-[11px] text-rose-400 mt-1.5">{errors.phone}</p>}
            </div>
          </div>

          {/* Photo previews */}
          {attachedPhotos.length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto py-1">
              {attachedPhotos.map((photo, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-md">
                  <img src={photo.preview} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label={lang === 'es' ? `Quitar foto ${i + 1}` : `Remove photo ${i + 1}`}
                    className="absolute top-1 right-1 bg-black/80 hover:bg-rose-600 text-white p-1 rounded-full transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Public estimate and WhatsApp contact. */}
          <div className="pt-6 border-t border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="text-xs text-neutral-400 mb-1">
                {lang === 'es' ? 'Rango orientativo en taller:' : 'Estimated shop price range:'}
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                ${activeService.minMxn.toLocaleString()} – ${activeService.maxMxn.toLocaleString()} <span className="text-sm font-bold text-amber-400">MXN</span>
                <span className="text-xs text-neutral-400 ml-2 font-normal">
                  (Aprox. ${usdMin} – ${usdMax} USD)
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                {lang === 'es' ? 'Presupuesto sin compromiso • Incluye garantía por escrito • Precio final sujeto a revisión física del vehículo' : 'No obligation quote • Includes written warranty • Final price subject to physical inspection of the vehicle'}
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-2.5">
              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={sending || Boolean(sent)}
                className="action-pill action-green disabled:opacity-60 disabled:cursor-wait"
              >
                <MessageCircle className="w-4 h-4 fill-neutral-950" />
                <span>
                  {sending
                    ? (lang === 'es' ? 'Guardando…' : 'Saving…')
                    : (lang === 'es' ? 'Enviar por WhatsApp' : 'Send via WhatsApp')}
                </span>
              </button>
              {saveWarning && !sent && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{saveWarning}</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
