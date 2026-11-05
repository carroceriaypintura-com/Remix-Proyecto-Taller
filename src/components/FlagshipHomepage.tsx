import { useState } from 'react';
import {
  ChevronRight,
  MapPin,
  ExternalLink,
  X,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { BUSINESS_INFO, REAL_WORK_PHOTOS } from '../data/content';

export default function FlagshipHomepage() {
  const [selectedPhoto, setSelectedPhoto] = useState<{
    src: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const whatsappMessage = encodeURIComponent(
    'Hola Carrocería y Pintura Nogales, me gustaría cotizar una reparación para mi auto.'
  );

  return (
    <div className="relative w-full bg-[#07090c] text-white overflow-hidden bg-carbon-weave selection:bg-emerald-500 selection:text-black">
      
      {/* Dynamic Ambient Carbon Glow Lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neutral-800/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[800px] left-0 w-[400px] h-[400px] bg-neutral-800/20 rounded-full blur-[120px] pointer-events-none" />

      {/* ========================================================
          1. HERO SECTION: Original workshop photograph & typography
          ======================================================== */}
      <section className="relative pt-8 sm:pt-14 pb-12 border-b border-white/10">
        
        {/* Left Side: Editorial Typography & WhatsApp CTA */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid lg:grid-cols-2 items-center gap-8 lg:gap-12">
          <div className="max-w-2xl lg:max-w-xl space-y-6">
            
            {/* Slogan Pill / Top Accent */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.3em] uppercase text-neutral-300">
                MÁS QUE UN TALLER
              </span>
              <div className="w-16 h-[1px] bg-neutral-400/60" />
            </div>

            {/* Main Title: Editorial Serif High Contrast */}
            <h1 className="font-serif-luxury text-4xl sm:text-6xl lg:text-[72px] font-bold text-white tracking-tight leading-[1.08] drop-shadow-md">
              Brillo que se nota. <br />
              <span className="text-neutral-100">Trabajo que responde.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm tracking-[0.22em] text-neutral-300 uppercase font-semibold leading-relaxed pt-1">
              HOJALATERÍA • PINTURA • DETALLE NIVEL AGENCIA
            </p>

            {/* Glowing Emerald WhatsApp Button (Mockup Exact Match) */}
            <div className="pt-2 sm:pt-4">
              <a
                href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between gap-4 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-[#0a1f14]/90 hover:bg-[#0f2d1e] border-2 border-emerald-500/70 hover:border-emerald-400 text-white font-bold text-sm sm:text-base shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] transition-all duration-300 hover:scale-[1.02] group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <i className="fa-brands fa-whatsapp text-emerald-400 text-xl sm:text-2xl group-hover:scale-110 transition-transform"></i>
                  <span className="font-bold tracking-wide">Cotiza por WhatsApp</span>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Bottom Hero Taglines: ATENCIÓN EN NOGALES | TU AUTO EN LAS MEJORES MANOS */}
            <div className="pt-8 sm:pt-14 flex items-center justify-between text-neutral-400 text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold border-t border-white/10 max-w-lg">
              <div>ATENCIÓN EN NOGALES</div>
              <div className="flex items-center gap-2 text-right">
                <span className="w-1 h-3 bg-neutral-500 rounded-full inline-block" />
                <span className="text-neutral-300">TU AUTO EN LAS MEJORES MANOS</span>
              </div>
            </div>

          </div>
          <figure className="overflow-hidden rounded-2xl border border-white/15 bg-black shadow-xl">
            <img
              src={REAL_WORK_PHOTOS[4].src}
              alt={REAL_WORK_PHOTOS[4].title}
              className="w-full max-h-[560px] object-contain"
              fetchPriority="high"
            />
            <figcaption className="px-4 py-3 text-xs text-neutral-300 border-t border-white/10">
              Camaro gris · Fotografía real de nuestro taller
            </figcaption>
          </figure>
        </div>

      </section>

      {/* ========================================================
          2. BOTTOM HERO NAVIGATION BAR: Servicios | Galería | Ubicación
          ======================================================== */}
      <section className="relative z-20 border-b border-white/10 bg-[#0a0d12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            
            {/* Tab 1: Servicios (Spray Gun Icon) */}
            <button
              onClick={() => scrollTo('servicios')}
              className="flex items-center justify-between p-4 sm:p-5 rounded-xl bg-carbon-card border border-white/10 hover:border-white/30 text-white transition-all duration-300 hover:bg-[#121620] group cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-3.5">
                {/* Automotive Spray Gun Vector Icon */}
                <div className="w-10 h-10 rounded-lg bg-neutral-900/80 border border-white/10 flex items-center justify-center text-neutral-300 group-hover:text-amber-400 transition-colors">
                  <svg
                    className="w-6 h-6 fill-none stroke-currentColor stroke-2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 3h4l2 4H9L7 3z" />
                    <path d="M10 7v3l-3 4v6h4v-6l-3-4" />
                    <path d="M12 9l6-2 1 2-5 3" />
                    <circle cx="17" cy="14" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="21" cy="15" r="1" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-serif-luxury text-lg sm:text-xl font-bold tracking-wide group-hover:text-amber-300 transition-colors">
                    Servicios
                  </div>
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    Hojalatería & Horno
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            {/* Tab 2: Galería (Gallery Picture Icon) */}
            <button
              onClick={() => scrollTo('galeria')}
              className="flex items-center justify-between p-4 sm:p-5 rounded-xl bg-carbon-card border border-white/10 hover:border-white/30 text-white transition-all duration-300 hover:bg-[#121620] group cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-neutral-900/80 border border-white/10 flex items-center justify-center text-neutral-300 group-hover:text-amber-400 transition-colors">
                  <svg
                    className="w-6 h-6 fill-none stroke-currentColor stroke-2"
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-serif-luxury text-lg sm:text-xl font-bold tracking-wide group-hover:text-amber-300 transition-colors">
                    Galería
                  </div>
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    Trabajos Reales
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            {/* Tab 3: Ubicación (Map Pin with Circle Icon) */}
            <button
              onClick={() => scrollTo('ubicacion')}
              className="flex items-center justify-between p-4 sm:p-5 rounded-xl bg-carbon-card border border-white/10 hover:border-white/30 text-white transition-all duration-300 hover:bg-[#121620] group cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-neutral-900/80 border border-white/10 flex items-center justify-center text-neutral-300 group-hover:text-rose-400 transition-colors">
                  <MapPin className="w-6 h-6 text-rose-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-left">
                  <div className="font-serif-luxury text-lg sm:text-xl font-bold tracking-wide group-hover:text-amber-300 transition-colors">
                    Ubicación
                  </div>
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    Google Maps & GPS
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

          </div>
        </div>
      </section>

      {/* ========================================================
          3. SECCIÓN: Trabajos recientes (3 Comparison / Progress Photos)
          ======================================================== */}
      <section className="py-14 sm:py-20 border-b border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-neutral-500" />
              <h2 className="font-serif-luxury text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wide">
                Trabajos recientes
              </h2>
            </div>

            <button
              onClick={() => scrollTo('galeria')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-white/15 text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white transition-all hover:scale-105 cursor-pointer shadow-sm w-fit"
            >
              <span>Ver galería completa</span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[REAL_WORK_PHOTOS[0], REAL_WORK_PHOTOS[8], REAL_WORK_PHOTOS[5]].map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setSelectedPhoto({ src: photo.src, title: photo.title, subtitle: photo.desc })}
                className="group text-left cursor-pointer rounded-2xl bg-carbon-card border border-white/10 hover:border-white/30 overflow-hidden shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="aspect-[4/3] bg-black overflow-hidden">
                  <img
                    src={photo.src}
                    alt={photo.title}
                    loading="lazy"
                    className="w-full h-full object-contain transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4 border-t border-white/5">
                  <h3 className="font-serif-luxury text-xl font-bold">{photo.title}</h3>
                  <p className="text-xs text-neutral-400 mt-1">{photo.desc}</p>
                </div>
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================
          4. SECCIÓN: Síguenos en Instagram (3 Showcase Cards with Typography Overlay)
          ======================================================== */}
      <section className="py-14 sm:py-20 border-b border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header: SÍGUENOS EN Instagram */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] uppercase text-neutral-400 mb-1">
                <span className="w-6 h-[1.5px] bg-neutral-500" />
                <span>SÍGUENOS EN</span>
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                Instagram
              </h2>
            </div>

            <a
              href={BUSINESS_INFO.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-white/15 text-xs sm:text-sm font-semibold text-neutral-200 hover:text-white transition-all hover:scale-105 cursor-pointer shadow-sm w-fit group"
            >
              <i className="fa-brands fa-instagram text-rose-400 text-sm"></i>
              <span>Ver más en Instagram</span>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* 3 Instagram Image Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Original GMC photograph */}
            <a
              href={BUSINESS_INFO.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-white/10 hover:border-white/30 group cursor-pointer shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <img
                src={REAL_WORK_PHOTOS[2].src}
                alt={REAL_WORK_PHOTOS[2].title}
                loading="lazy"
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              
              <div className="absolute bottom-5 left-5 right-5">
                <div className="text-xs font-semibold tracking-[0.25em] text-neutral-200 uppercase leading-snug">
                  GMC <br />
                  <span className="text-white font-bold">PLATEADA</span>
                </div>
              </div>

              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>

            {/* Original Camaro photograph */}
            <a
              href={BUSINESS_INFO.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-white/10 hover:border-white/30 group cursor-pointer shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <img
                src={REAL_WORK_PHOTOS[4].src}
                alt={REAL_WORK_PHOTOS[4].title}
                loading="lazy"
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              
              <div className="absolute bottom-5 left-5 right-5">
                <div className="text-xs font-semibold tracking-[0.25em] text-neutral-200 uppercase leading-snug">
                  CAMARO <br />
                  <span className="text-white font-bold">GRIS</span>
                </div>
              </div>

              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>

            {/* Original workshop photograph */}
            <a
              href={BUSINESS_INFO.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-white/10 hover:border-white/30 group cursor-pointer shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <img
                src={REAL_WORK_PHOTOS[3].src}
                alt={REAL_WORK_PHOTOS[3].title}
                loading="lazy"
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              
              <div className="absolute bottom-5 left-5 right-5">
                <div className="text-xs font-semibold tracking-[0.25em] text-neutral-200 uppercase leading-snug">
                  NUESTRO <br />
                  <span className="text-white font-bold">TALLER</span>
                </div>
              </div>

              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>

          </div>

        </div>
      </section>

      {/* ========================================================
          5. LOWER ACTION BAR: Facebook Pill + Big WhatsApp Banner + Slogans
          ======================================================== */}
      <section className="py-14 sm:py-20 relative bg-gradient-to-b from-transparent to-[#040507]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Row 1: Facebook Button & "AUTOS HISTORIAS PERSONAS" */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            
            <a
              href={BUSINESS_INFO.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-sm sm:text-base shadow-lg transition-all hover:scale-105 cursor-pointer group"
            >
              <i className="fa-brands fa-facebook-f text-base"></i>
              <span>Síguenos en Facebook</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>

            <div className="flex items-center gap-3 text-neutral-400 text-xs tracking-[0.3em] uppercase font-semibold">
              <span>AUTOS HISTORIAS PERSONAS</span>
              <span className="w-10 h-[1.5px] bg-neutral-500" />
            </div>

          </div>

          {/* Row 2: Big Prominent Glowing WhatsApp / Phone Pill Button */}
          <div className="flex justify-center">
            <a
              href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-2xl flex items-center justify-between p-4 sm:p-6 rounded-full bg-[#0a1e14]/95 hover:bg-[#0f2d1e] border-2 border-emerald-500/80 hover:border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_55px_rgba(16,185,129,0.45)] transition-all duration-300 hover:scale-[1.02] group cursor-pointer"
            >
              <div className="flex items-center gap-4 sm:gap-6 pl-2 sm:pl-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <i className="fa-brands fa-whatsapp text-emerald-400 text-2xl sm:text-3xl group-hover:scale-110 transition-transform"></i>
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-medium text-emerald-300 tracking-wider uppercase">
                    Llamar o escribir
                  </div>
                  <div className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight group-hover:text-emerald-100 transition-colors">
                    (631) 132-2616
                  </div>
                </div>
              </div>

              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mr-2 sm:mr-4 group-hover:bg-emerald-500/30 transition-colors">
                <ChevronRight className="w-6 h-6 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          </div>

          {/* Row 3: Bottom Decorative Brand Taglines */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-neutral-400 text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold pt-6 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-[1px] bg-neutral-600" />
              <span>CALIDAD HOY MÁS KILÓMETROS MAÑANA</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-[1px] bg-neutral-600" />
              <span>NOGALES, SONORA</span>
            </div>
          </div>

        </div>
      </section>

      {/* Lightbox Modal for Photo Inspection */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-[#0d1016] border border-white/15 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-white">
                {selectedPhoto.title}
              </h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                aria-label="Cerrar foto"
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-[16/10] bg-black rounded-xl overflow-hidden">
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.title}
                className="w-full h-full object-contain"
              />
            </div>

            {selectedPhoto.subtitle && (
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed px-1">
                {selectedPhoto.subtitle}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <a
                href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>Cotizar trabajo similar por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
