import { useEffect, useRef, useState } from 'react';
import { MessageCircle, ArrowUp, MapPin, Play } from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { Language } from './types';
import Header from './components/Header';
import FlagshipHomepage from './components/FlagshipHomepage';
import ServicesGrid from './components/ServicesGrid';
import ReviewsSection from './components/ReviewsSection';
import RealGallery from './components/RealGallery';
import WorkshopVideos from './components/WorkshopVideos';
import SocialShowcase from './components/SocialShowcase';
import QuoteEstimator from './components/QuoteEstimator';
import LocationContact from './components/LocationContact';
import Footer from './components/Footer';
import { BACKGROUND_VIDEO, BACKGROUND_POSTER, BUSINESS_INFO } from './data/content';
import { trackWhatsAppClick } from './lib/analytics';

export default function App() {
  const [lang, setLang] = useState<Language>('es');
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  // En el celular no se descarga el video de fondo (15 MB): se muestra
  // una foto fija. En computadora sí se reproduce el video.
  const [isMobileBackground, setIsMobileBackground] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobileBackground(query.matches);
    onChange();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      bgVideoRef.current?.pause();
    }
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-neutral-100 flex flex-col selection:bg-emerald-500 selection:text-neutral-950 scroll-smooth font-['Plus_Jakarta_Sans',sans-serif] relative">
      {/* Video de fondo: carros del taller, en bucle y sin audio. En el
          celular se muestra una foto fija para no descargar el video. */}
      {isMobileBackground ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 h-full w-full bg-cover bg-center bg-mobile-pan"
          style={{ backgroundImage: `url(${BACKGROUND_POSTER})` }}
        />
      ) : (
        <video
          ref={bgVideoRef}
          className="fixed inset-0 -z-10 h-full w-full object-cover"
          src={BACKGROUND_VIDEO}
          poster={BACKGROUND_POSTER}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
      )}
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,12,16,0.34),rgba(10,12,16,0.52))]" />

      {/* Header with brand identity and contact links. */}
      <Header />

      <main className="flex-1 relative z-10">
        {/* Compact homepage: Jeep, location, navigation and photo album. */}
        <FlagshipHomepage />

        <ServicesGrid lang={lang} />
        <RealGallery lang={lang} />
        <WorkshopVideos lang={lang} />
        <ReviewsSection lang={lang} />
        <div className="max-w-7xl mx-auto px-4 py-4">
          <details className="rounded-2xl glass-panel">
            <summary className="action-pill action-purple m-3 cursor-pointer"><Play aria-hidden="true" />Videos y opciones de redes</summary>
            <SocialShowcase lang={lang} />
          </details>
        </div>
        <QuoteEstimator lang={lang} />
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <details className="rounded-2xl glass-panel">
            <summary className="action-pill action-rose m-3 cursor-pointer"><MapPin aria-hidden="true" />Más opciones de ubicación y contacto</summary>
            <LocationContact lang={lang} />
          </details>
        </div>
      </main>

      {/* 8. Modern Quiet Footer */}
      <Footer lang={lang} />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5">
        <button
          onClick={scrollToTop}
          aria-label="Volver arriba"
          className="action-pill action-blue !px-3"
        >
          <ArrowUp className="w-4 h-4" />
        </button>

        <a
          href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(
            'Hola Carrocería y Pintura Nogales, me gustaría cotizar una reparación.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
          onClick={() => trackWhatsAppClick('flotante')}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:scale-105 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 fill-black" />
          <span>(631) 132-2616</span>
        </a>
      </div>

      {/* Vercel Speed Insights */}
      <SpeedInsights />
      
      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}
