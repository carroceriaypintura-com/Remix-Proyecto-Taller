import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Images, X, ChevronLeft, ChevronRight, MessageCircle, ZoomIn } from 'lucide-react';
import { Language } from '../types';
import { REAL_WORK_PHOTOS, BUSINESS_INFO } from '../data/content';

export default function RealGallery({ lang }: { lang: Language }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const featured = ['camaro-gris', 'pulido-bmw', 'gmc-frente'];
  const photos = featured.map((id) => REAL_WORK_PHOTOS.find((photo) => photo.id === id)!);
  const photo = active === null ? null : REAL_WORK_PHOTOS[active];
  const close = () => { setOpen(false); setActive(null); };

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); setActive(null); }
      if (event.key === 'ArrowRight') setActive((index) => index === null ? null : (index + 1) % REAL_WORK_PHOTOS.length);
      if (event.key === 'ArrowLeft') setActive((index) => index === null ? null : (index - 1 + REAL_WORK_PHOTOS.length) % REAL_WORK_PHOTOS.length);
      if (event.key === 'Tab') {
        const dialog = document.getElementById('photo-library');
        const controls = Array.from(dialog?.querySelectorAll<HTMLElement>('button, a[href]') ?? []);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
      previousFocus?.focus();
    };
  }, [open]);

  return (
    <section id="galeria" className="py-8 sm:py-12 border-b border-white/10 bg-[#10131c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">{lang === 'es' ? 'Álbum de trabajos' : 'Workshop album'}</h2>
          </div>
          <button type="button" onClick={() => { setActive(null); setOpen(true); }} className="action-pill action-purple">
            <Images aria-hidden="true" />{lang === 'es' ? `Abrir biblioteca (${REAL_WORK_PHOTOS.length} fotos)` : `Open library (${REAL_WORK_PHOTOS.length} photos)`}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {photos.map((item) => (
            <button type="button" key={item.id} aria-label={`${lang === 'es' ? 'Ampliar' : 'Enlarge'}: ${item.title}`} onClick={() => { setActive(REAL_WORK_PHOTOS.indexOf(item)); setOpen(true); }} className="group overflow-hidden rounded-xl border border-white/15 bg-black text-left focus-visible:outline-2 focus-visible:outline-purple-400">
              <img src={item.src} alt={item.title} loading="lazy" className="aspect-square sm:aspect-[4/3] w-full object-cover group-hover:scale-105 transition-transform" />
              <span className="flex items-center justify-between gap-1 text-[10px] sm:text-sm px-2 sm:px-3 py-2 text-neutral-200"><span className="truncate">{lang === 'es' ? item.title : item.titleEn}</span><ZoomIn aria-hidden="true" className="w-4 h-4 shrink-0 text-purple-300" /></span>
            </button>
          ))}
        </div>
      </div>
      {open && createPortal(
        <div className="fixed inset-0 z-[70] bg-black/90 p-2 sm:p-6 flex items-center justify-center" onClick={close}>
          <div id="photo-library" role="dialog" aria-modal="true" aria-labelledby="album-title" className="w-full max-w-5xl max-h-[94dvh] overflow-y-auto rounded-2xl border border-white/15 bg-[#131823]" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 p-3 sm:p-4 bg-[#131823] border-b border-white/10">
              <h3 id="album-title" className="font-bold text-sm sm:text-lg">{photo ? (lang === 'es' ? photo.title : photo.titleEn) : `${lang === 'es' ? 'Biblioteca completa' : 'Full library'} · ${REAL_WORK_PHOTOS.length} fotos`}</h3>
              <button ref={closeRef} type="button" onClick={close} aria-label="Cerrar álbum" className="action-pill action-rose !px-3"><X aria-hidden="true" /><span className="hidden sm:inline">Cerrar</span></button>
            </div>
            {photo ? (
              <div className="p-3 sm:p-4 space-y-3">
                <img src={photo.src} alt={photo.title} className="w-full h-[48dvh] sm:h-[58dvh] object-contain bg-black rounded-xl" />
                <div className="flex items-center justify-between gap-2">
                  <button type="button" aria-label="Foto anterior" onClick={() => setActive((active! - 1 + REAL_WORK_PHOTOS.length) % REAL_WORK_PHOTOS.length)} className="action-pill action-purple !px-3"><ChevronLeft aria-hidden="true" /></button>
                  <button type="button" onClick={() => setActive(null)} className="action-pill action-purple"><Images aria-hidden="true" />{lang === 'es' ? 'Ver todas' : 'See all'}</button>
                  <button type="button" aria-label="Foto siguiente" onClick={() => setActive((active! + 1) % REAL_WORK_PHOTOS.length)} className="action-pill action-purple !px-3"><ChevronRight aria-hidden="true" /></button>
                </div>
                <p className="text-xs text-neutral-300">{active! + 1} / {REAL_WORK_PHOTOS.length} · {lang === 'es' ? photo.desc : photo.descEn}</p>
                <a href={`${BUSINESS_INFO.social.whatsapp}?text=${encodeURIComponent(`Hola, me interesa cotizar un trabajo similar a la foto ${photo.title}.`)}`} target="_blank" rel="noopener noreferrer" className="action-pill action-green"><MessageCircle aria-hidden="true" />Cotizar por WhatsApp</a>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 sm:p-4">
                {REAL_WORK_PHOTOS.map((item, index) => (
                  <button key={item.id} type="button" onClick={() => setActive(index)} className="rounded-xl overflow-hidden border border-white/10 bg-black text-left">
                    <img src={item.src} alt={item.title} loading="lazy" className="aspect-[4/3] w-full object-contain" />
                    <span className="block p-2 text-xs text-neutral-200">{lang === 'es' ? item.title : item.titleEn}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>, document.body
      )}
    </section>
  );
}
