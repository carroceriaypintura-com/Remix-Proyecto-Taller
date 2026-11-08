import { Wrench, Images, Calculator, MapPin, MessageCircle } from 'lucide-react';
import { Language } from '../types';
import { BUSINESS_INFO } from '../data/content';

interface FooterProps {
  lang: Language;
}

export default function Footer({ lang }: FooterProps) {
  return (
    <footer className="bg-[#0e1017] text-neutral-400 border-t border-white/5 text-xs py-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/5">
          
          <div className="space-y-1.5">
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-amber-500">🛡️</span>
              <span>Carrocería & Pintura Nogales</span>
            </div>
            <p className="text-xs text-neutral-400 max-w-md">
              {lang === 'es'
                ? 'Hojalatería, pintura al horno y detallado vehicular Genesis en Nogales, Sonora.'
                : 'Collision repair, oven-baked paint, and Genesis auto detailing in Nogales, Sonora.'}
            </p>
            <div className="text-[11px] text-neutral-300 pt-1">
              {BUSINESS_INFO.address} • Tel: {BUSINESS_INFO.phoneDisplay}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="#servicios"
              className="action-pill action-amber"
            >
              <Wrench aria-hidden="true" />
              {lang === 'es' ? 'Servicios' : 'Services'}
            </a>
            <a
              href="#galeria"
              className="action-pill action-purple"
            >
              <Images aria-hidden="true" />
              {lang === 'es' ? 'Galería' : 'Gallery'}
            </a>
            <a
              href="#cotizador"
              className="action-pill action-blue"
            >
              <Calculator aria-hidden="true" />
              {lang === 'es' ? 'Cotizador' : 'Estimator'}
            </a>
            <a
              href="#ubicacion"
              className="action-pill action-rose"
            >
              <MapPin aria-hidden="true" />
              {lang === 'es' ? 'Ubicación' : 'Location'}
            </a>
            <a
              href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="action-pill action-green"
            >
              <MessageCircle aria-hidden="true" />WhatsApp
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
          <div>
            © {new Date().getFullYear()} Carrocería & Pintura Nogales. {lang === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}
          </div>
          <div className="flex items-center gap-2 text-neutral-400">
            <span>{lang === 'es' ? 'Col. Los Encinos, Nogales, Sonora' : 'Los Encinos, Nogales, Sonora'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
