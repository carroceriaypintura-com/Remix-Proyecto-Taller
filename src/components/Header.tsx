import { BUSINESS_INFO } from '../data/content';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#080a0e]/95 backdrop-blur-md border-b border-white/10 transition-all shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 py-3 lg:py-0 lg:h-24 grid grid-cols-[minmax(0,1fr)_auto] lg:flex items-center justify-between gap-x-2 sm:gap-x-4 gap-y-3">
        
        {/* Left: Shield Logo + Typography */}
        <a 
          href="#" 
          className="flex items-center gap-2.5 sm:gap-4 group min-w-0 shrink-0"
        >
          {/* Silver Chrome Shield Logo with Car Silhouette */}
          <div className="relative w-10 h-12 sm:w-14 sm:h-16 shrink-0 transition-transform duration-300 group-hover:scale-105">
            <img
              src="/assets/new_design/shield_badge.png"
              alt="Carrocería y Pintura Nogales"
              className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(255,255,255,0.12)]"
            />
          </div>

          <div className="flex flex-col">
            <div className="font-serif-luxury text-lg sm:text-2xl md:text-[26px] font-bold text-white tracking-wide leading-tight group-hover:text-amber-300 transition-colors">
              Carrocería y Pintura
            </div>
            <div className="text-[11px] sm:text-xs font-semibold tracking-[0.35em] text-neutral-300 uppercase leading-snug">
              N O G A L E S
            </div>
            <div className="text-[8px] sm:text-[9px] tracking-[0.25em] text-neutral-400 font-medium uppercase mt-0.5">
              ESTÉTICA QUE VALORIZA TU CAMINO
            </div>
          </div>
        </a>

        {/* Contact and social links stay visible at every screen size. */}
        <nav
          aria-label="Contacto y redes sociales"
          className="col-span-2 row-start-2 grid grid-cols-2 min-[360px]:grid-cols-4 sm:flex sm:flex-wrap lg:flex-nowrap items-center gap-2 lg:gap-3 lg:ml-auto"
        >
          <a
            href={BUSINESS_INFO.social.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar por WhatsApp"
            className="inline-flex min-h-11 items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3.5 py-2.5 rounded-full text-[10px] sm:text-sm font-bold text-black bg-emerald-500 hover:bg-emerald-400 border border-emerald-300/30 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:scale-105"
          >
            <i className="fa-brands fa-whatsapp text-base" aria-hidden="true"></i>
            <span>WhatsApp<span className="hidden xl:inline"> {BUSINESS_INFO.whatsappDisplay}</span></span>
          </a>

          <a
            href={BUSINESS_INFO.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            title="Facebook Oficial"
            className="inline-flex min-h-11 items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3.5 py-2.5 rounded-full text-[10px] sm:text-sm font-semibold text-white bg-[#1877F2] hover:bg-[#166fe5] border border-blue-400/30 transition-all shadow-md hover:scale-105"
          >
            <i className="fa-brands fa-facebook-f text-sm" aria-hidden="true"></i>
            <span>Facebook</span>
          </a>

          <a
            href={BUSINESS_INFO.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram Oficial"
            className="inline-flex min-h-11 items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3.5 py-2.5 rounded-full text-[10px] sm:text-sm font-semibold text-white bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 border border-rose-400/30 transition-all shadow-md hover:scale-105"
          >
            <i className="fa-brands fa-instagram text-sm" aria-hidden="true"></i>
            <span>Instagram</span>
          </a>

          <a
            href={BUSINESS_INFO.social.twitter}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X (Twitter)"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-3.5 py-2.5 rounded-full text-[10px] sm:text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 border border-white/20 transition-all shadow-md hover:scale-105"
          >
            <i className="fa-brands fa-x-twitter text-sm" aria-hidden="true"></i>
            <span className="sr-only">X</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
