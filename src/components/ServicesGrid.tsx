import { useEffect, useRef, useState } from 'react';
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  MessageCircle,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  Truck,
  Wrench,
} from 'lucide-react';
import { Language } from '../types';
import { SERVICES_LIST, BUSINESS_INFO } from '../data/content';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { trackWhatsAppClick } from '../lib/analytics';

interface ServicesGridProps {
  lang: Language;
}

// Iconos del cilindro, en el mismo orden que SERVICES_LIST.
const ICONS = [Paintbrush, Car, Wrench, Lightbulb, Sparkles, ShieldCheck, Truck];

// Contenido fijo aprobado por el dueño del taller: el cilindro muestra
// exactamente estos 7 servicios, sin depender de ediciones del panel.
export default function ServicesGrid({ lang }: ServicesGridProps) {
  const services = SERVICES_LIST;
  const count = services.length;
  const step = 360 / count;

  const [index, setIndex] = useState(0);
  const [radius, setRadius] = useState(320);
  const dragStartX = useRef<number | null>(null);
  const dragged = useRef(false);

  // En el celular el cilindro es más cerrado para que las tarjetas no se
  // salgan de la pantalla; en escritorio se abre más.
  useEffect(() => {
    const updateRadius = () => {
      const w = window.innerWidth;
      setRadius(w < 640 ? 235 : w < 1024 ? 285 : 330);
    };
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  const go = (i: number) => setIndex(((i % count) + count) % count);
  const prev = () => go(index - 1);
  const next = () => go(index + 1);

  const active = services[index];
  const activeTitle = lang === 'es' ? active.title : active.titleEn;
  const activeDesc = lang === 'es' ? active.desc : active.descEn;
  const activeTime =
    lang === 'es' ? active.time : (active as { timeEn?: string }).timeEn ?? active.time;
  const timeIsQuote = activeTime.toLowerCase().includes('whatsapp');

  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: stageRef, isVisible: stageVisible } = useScrollReveal({ threshold: 0.1 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX;
    dragged.current = false;
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    if (Math.abs(e.clientX - dragStartX.current) > 12) dragged.current = true;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <section id="servicios" className="py-10 sm:py-12 glass-band border-b border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={headerRef}
          className={`max-w-3xl mb-2 transition-all duration-700 ease-out ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2f7bff]/10 border border-[#7fb3ff]/30 text-[#7fb3ff] text-xs font-semibold mb-3">
            <Wrench className="w-3.5 h-3.5" />
            <span>{lang === 'es' ? 'Nuestros Servicios Principales' : 'Our Core Services'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-2.5">
            {lang === 'es' ? 'Especialidades de Carrocería & Pintura' : 'Auto Body & Paint Specialties'}
          </h2>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
            {lang === 'es'
              ? 'Hojalatería especializada, pintura automotriz y estética Genesis en Nogales, Sonora.'
              : 'Specialized bodywork, automotive paint and Genesis detailing in Nogales, Sonora.'}
          </p>
        </div>

        {/* Cilindro 3D de servicios */}
        <div
          ref={stageRef}
          className={`relative transition-all duration-700 ease-out ${
            stageVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div
            className="relative h-[360px] sm:h-[400px] select-none"
            style={{ perspective: '1200px', touchAction: 'pan-y', cursor: 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="region"
            aria-roledescription="carrusel"
            aria-label={lang === 'es' ? 'Servicios del taller' : 'Workshop services'}
          >
            <div
              className="absolute left-1/2 top-1/2 w-0 h-0"
              style={{
                transformStyle: 'preserve-3d',
                transform: `translateZ(${-radius}px) rotateY(${-index * step}deg)`,
                transition: 'transform 0.6s cubic-bezier(0.22, 0.9, 0.3, 1)',
              }}
            >
              {services.map((srv, i) => {
                const IconComponent = ICONS[i % ICONS.length];
                // Distancia angular al frente: solo el frente y sus vecinos se ven.
                let diff = Math.abs(i - index);
                diff = Math.min(diff, count - diff);
                const isActive = i === index;
                return (
                  <button
                    key={srv.number}
                    type="button"
                    onClick={() => {
                      if (!dragged.current) go(i);
                    }}
                    aria-label={lang === 'es' ? srv.title : srv.titleEn}
                    className="absolute text-left rounded-[22px] p-4 sm:p-5 focus:outline-none"
                    style={{
                      width: 224,
                      height: 258,
                      left: -112,
                      top: -129,
                      transform: `rotateY(${i * step}deg) translateZ(${radius}px)`,
                      backfaceVisibility: 'hidden',
                      opacity: diff === 0 ? 1 : diff === 1 ? 0.75 : 0,
                      pointerEvents: diff > 1 ? 'none' : 'auto',
                      background:
                        'linear-gradient(165deg, rgba(38, 48, 63, 0.88), rgba(18, 23, 32, 0.82))',
                      border: isActive
                        ? '1px solid rgba(127, 179, 255, 0.65)'
                        : '1px solid rgba(127, 179, 255, 0.28)',
                      boxShadow: isActive
                        ? '0 18px 44px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(47, 123, 255, 0.25), 0 8px 30px rgba(47, 123, 255, 0.25)'
                        : '0 18px 40px rgba(0, 0, 0, 0.55)',
                    }}
                  >
                    <span className="svc-float block" style={{ animationDelay: `${i * 0.35}s` }}>
                      <span
                        className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-white"
                        style={{
                          background: 'radial-gradient(circle at 35% 30%, #7fb3ff, #2f7bff 60%, #1c4fb0)',
                          boxShadow: '0 8px 22px rgba(47, 123, 255, 0.55)',
                        }}
                      >
                        <IconComponent className="w-6 h-6" />
                      </span>
                      <span className="block text-center text-[15px] sm:text-base font-extrabold leading-snug text-white min-h-[42px]">
                        {lang === 'es' ? srv.title : srv.titleEn}
                      </span>
                      <span className="mt-2 block text-center text-[13px] leading-snug text-[#9fb4d0]">
                        {lang === 'es' ? srv.desc : srv.descEn}
                      </span>
                      <span className="mt-3 block text-center text-[13px] font-bold text-[#a8c8ff]">
                        {lang === 'es' ? srv.time : (srv as { timeEn?: string }).timeEn ?? srv.time}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Flechas para girar el cilindro */}
            <button
              type="button"
              onClick={prev}
              aria-label={lang === 'es' ? 'Servicio anterior' : 'Previous service'}
              className="svc-arrow absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#7fb3ff]/50 bg-[#2f7bff]/90 text-white shadow-lg transition hover:bg-[#2f7bff] cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={lang === 'es' ? 'Servicio siguiente' : 'Next service'}
              className="svc-arrow absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#7fb3ff]/50 bg-[#2f7bff]/90 text-white shadow-lg transition hover:bg-[#2f7bff] cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Servicio activo: título, descripción y tiempo */}
          <div className="text-center -mt-1">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">{activeTitle}</h3>
            <p className="mx-auto mt-1 max-w-xl text-sm sm:text-base text-neutral-300 leading-relaxed min-h-[44px]">
              {activeDesc}
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#7fb3ff]/45 bg-[#2f7bff]/15 px-4 py-1.5 text-[13px] font-bold text-[#a8c8ff]">
              {timeIsQuote ? <MessageCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {activeTime}
            </span>

            {/* Puntos del cilindro */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {services.map((srv, i) => (
                <button
                  key={srv.number}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`${lang === 'es' ? 'Ver' : 'View'} ${lang === 'es' ? srv.title : srv.titleEn}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === index ? 'w-6 bg-[#2f7bff]' : 'w-2 bg-white/25 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>

            <a
              href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(
                lang === 'es'
                  ? `Hola, me interesa información y presupuesto sobre el servicio de "${activeTitle}".`
                  : `Hi, I am interested in details and a quote for "${activeTitle}".`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppClick('servicio')}
              className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(47,123,255,0.45)] transition hover:brightness-110"
              style={{ background: '#2f7bff', minHeight: 44 }}
            >
              <MessageCircle className="w-4 h-4" />
              {lang === 'es' ? 'Cotizar por WhatsApp' : 'Quote via WhatsApp'}
            </a>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {lang === 'es'
                ? 'Todo trabajo garantizado y de calidad'
                : 'All work guaranteed and quality'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
