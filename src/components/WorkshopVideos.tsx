import { Play } from 'lucide-react';
import { Language } from '../types';
import { WORKSHOP_VIDEOS } from '../data/content';

export default function WorkshopVideos({ lang }: { lang: Language }) {
  return (
    <section id="videos" className="py-8 sm:py-12 border-b border-white/10 bg-[#10131c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Play className="text-amber-400" aria-hidden="true" />
              {lang === 'es' ? 'Videos del taller' : 'Workshop videos'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              {lang === 'es'
                ? 'Nuestros trabajos en video, directo del taller.'
                : 'Our work on video, straight from the workshop.'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {WORKSHOP_VIDEOS.map((item) => (
            <figure key={item.id} className="overflow-hidden rounded-xl border border-white/15 bg-black text-left">
              <video
                src={item.src}
                muted
                loop
                playsInline
                controls
                preload="metadata"
                className="aspect-[9/16] w-full object-cover"
              />
              <figcaption className="px-2 sm:px-3 py-2 text-[10px] sm:text-sm text-neutral-200">
                {lang === 'es' ? item.title : item.titleEn}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
