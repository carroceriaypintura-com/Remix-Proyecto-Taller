import { Wrench, Images, MapPin, Calculator, Navigation, Phone, MessageCircle, Clock } from 'lucide-react';
import { BUSINESS_INFO, FEATURED_WORK_PHOTO } from '../data/content';

export default function FlagshipHomepage() {
  return (
    <div className="bg-carbon-weave">
      <section aria-labelledby="home-title" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 grid lg:grid-cols-2 gap-6 items-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-widest text-amber-300 uppercase">Carrocería · Pintura · Detallado</p>
          <h1 id="home-title" className="font-serif-luxury text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">Brillo que se nota.<br />Trabajo que responde.</h1>
          <p className="text-sm text-neutral-300">Tu taller en Los Encinos, Nogales.</p>
          <a href={`${BUSINESS_INFO.social.whatsapp}?text=${encodeURIComponent('Hola, me gustaría cotizar una reparación para mi auto.')}`} target="_blank" rel="noopener noreferrer" className="action-pill action-green">
            <MessageCircle aria-hidden="true" />Cotiza por WhatsApp
          </a>
        </div>
        <figure className="rounded-2xl overflow-hidden border border-white/15 bg-black">
          <img src={FEATURED_WORK_PHOTO.src} alt={FEATURED_WORK_PHOTO.title} fetchPriority="high" className="w-full h-[300px] sm:h-[420px] lg:h-[440px] object-contain" />
        </figure>
      </section>

      <section id="ubicacion" aria-labelledby="location-title" className="border-y border-white/10 bg-[#10141d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid md:grid-cols-2 gap-5 items-center">
          <div className="space-y-3">
            <h2 id="location-title" className="text-xl sm:text-2xl font-bold flex items-center gap-2"><MapPin className="text-rose-400" aria-hidden="true" />Visítanos en Nogales</h2>
            <address className="not-italic text-sm text-neutral-300">{BUSINESS_INFO.address}<br />{BUSINESS_INFO.city}</address>
            <p className="text-xs text-neutral-400 flex items-center gap-2"><Clock className="w-4 h-4 shrink-0" aria-hidden="true" />{BUSINESS_INFO.hoursWeekday}</p>
            <div className="flex flex-wrap gap-2">
              <a href={BUSINESS_INFO.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="action-pill action-rose"><Navigation aria-hidden="true" />Cómo llegar</a>
              <a href={`tel:${BUSINESS_INFO.phoneCall}`} className="action-pill action-blue"><Phone aria-hidden="true" />Llamar</a>
            </div>
          </div>
          <iframe title="Mini mapa del taller en Los Encinos, Nogales" src="https://maps.google.com/maps?q=31.2988874,-110.9549794&z=16&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="w-full h-48 sm:h-56 rounded-2xl border border-white/15" />
        </div>
      </section>

      <nav aria-label="Secciones del taller" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <a href="#servicios" className="action-pill action-amber"><Wrench aria-hidden="true" />Servicios</a>
        <a href="#galeria" className="action-pill action-purple"><Images aria-hidden="true" />Álbum</a>
        <a href="#ubicacion" className="action-pill action-rose"><MapPin aria-hidden="true" />Ubicación</a>
        <a href="#cotizador" className="action-pill action-blue"><Calculator aria-hidden="true" />Cotizar</a>
      </nav>
    </div>
  );
}
