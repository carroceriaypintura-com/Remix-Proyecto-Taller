import { useState, useEffect } from 'react';
import {
  MessageCircle,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Share2,
  Play,
  Image as ImageIcon,
  Instagram,
  Facebook,
  PlusCircle,
  X,
  Upload,
  Trash2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Filter,
  Camera,
} from 'lucide-react';
import { Language } from '../types';
import { BUSINESS_INFO, REAL_WORK_PHOTOS } from '../data/content';

interface SocialShowcaseProps {
  lang: Language;
}

const FB_REEL_URL = 'https://www.facebook.com/reel/1083577567886919/';
const FB_REEL_IFRAME_SRC =
  'https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1083577567886919%2F&show_text=true&width=267&t=0';

const FB_POST_URL =
  'https://www.facebook.com/AutoDetalladoGenesis/posts/pfbid0faUof5oWSX15UuwhQvLkod2td7CvTjhsekY4ss3geFg4YrZEjiQFxshchbS8KBBYl';
const FB_POST_IFRAME_SRC =
  'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FAutoDetalladoGenesis%2Fposts%2Fpfbid0faUof5oWSX15UuwhQvLkod2td7CvTjhsekY4ss3geFg4YrZEjiQFxshchbS8KBBYl&show_text=true&width=500';

type MediaType = 'feed' | 'reel' | 'post';
type PlatformFilter = 'all' | 'workshop' | 'facebook' | 'instagram';

export interface SocialPostItem {
  id: string;
  image: string;
  platform: 'workshop' | 'facebook' | 'instagram';
  channelName: string;
  channelUrl: string;
  titleEs: string;
  titleEn: string;
  captionEs: string;
  captionEn: string;
  tag: string;
  isUserAdded?: boolean;
}

// Owner-supplied photographs, not a fetched social feed or verified social posts.
const INITIAL_SOCIAL_FEED_POSTS: SocialPostItem[] = REAL_WORK_PHOTOS.map((photo) => ({
  id: photo.id,
  image: photo.src,
  platform: 'workshop',
  channelName: 'Fotos del taller',
  channelUrl: BUSINESS_INFO.social.facebook,
  titleEs: photo.title,
  titleEn: photo.titleEn,
  captionEs: photo.desc,
  captionEn: photo.descEn,
  tag: '#FotosReales',
}));

export default function SocialShowcase({ lang }: SocialShowcaseProps) {
  const [activeMedia, setActiveMedia] = useState<MediaType>('feed');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [posts, setPosts] = useState<SocialPostItem[]>(INITIAL_SOCIAL_FEED_POSTS);
  
  // Modal for Adding a New Social Photo
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPlatform, setNewPlatform] = useState<'facebook' | 'instagram'>('facebook');
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newPostUrl, setNewPostUrl] = useState('');
  const [newTag, setNewTag] = useState('');

  // Lightbox Modal for Viewing Photo Details
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  // Load custom posts from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('genesis_custom_social_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPosts([...parsed, ...INITIAL_SOCIAL_FEED_POSTS]);
        }
      }
    } catch {
      // ignore JSON errors
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;

    const channelName =
      newPlatform === 'facebook' ? 'Auto Detallado Genesis' : '@carroceria_pintura_genesis';
    const channelUrl =
      newPostUrl.trim() ||
      (newPlatform === 'facebook'
        ? 'https://www.facebook.com/AutoDetalladoGenesis'
        : 'https://www.instagram.com/carroceria_pintura_genesis');

    const newPost: SocialPostItem = {
      id: `custom-${Date.now()}`,
      image: newImageUrl.trim(),
      platform: newPlatform,
      channelName,
      channelUrl,
      titleEs: newTitle.trim() || (lang === 'es' ? 'Nueva Foto de Red Social' : 'New Social Photo'),
      titleEn: newTitle.trim() || 'New Social Photo',
      captionEs: newCaption.trim() || (lang === 'es' ? 'Publicación compartida de nuestras redes sociales.' : 'Shared post from our official channels.'),
      captionEn: newCaption.trim() || 'Shared post from our official channels.',
      tag: newTag.trim() || (newPlatform === 'facebook' ? '#AutoDetalladoGenesis' : '#carroceria_pintura_genesis'),
      isUserAdded: true,
    };

    const updated = [newPost, ...posts];
    setPosts(updated);

    // Save only user added to localStorage
    const userAddedOnly = updated.filter((p) => p.isUserAdded);
    try {
      localStorage.setItem('genesis_custom_social_posts', JSON.stringify(userAddedOnly));
    } catch {
      // Storage error safeguard
    }

    // Reset Form
    setNewImageUrl('');
    setNewTitle('');
    setNewCaption('');
    setNewPostUrl('');
    setNewTag('');
    setIsAddModalOpen(false);
  };

  const handleDeletePost = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = posts.filter((p) => p.id !== id);
    setPosts(updated);
    const userAddedOnly = updated.filter((p) => p.isUserAdded);
    try {
      localStorage.setItem('genesis_custom_social_posts', JSON.stringify(userAddedOnly));
    } catch {
      // Storage error safeguard
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (platformFilter === 'all') return true;
    return post.platform === platformFilter;
  });

  const content = {
    es: {
      badge: 'Fotos Reales & Redes Sociales',
      title: 'Fotos Reales de Nuestro Taller',
      subtitle:
        'Estas fotografías fueron compartidas directamente por el taller. También puedes visitar nuestros perfiles de Facebook e Instagram.',
      tabFeed: 'Fotos del Taller',
      tabReel: 'Video Reel de Facebook',
      tabPost: 'Publicación de Facebook',
      addBtn: 'Agregar Foto de Mis Redes',
      filterAll: 'Todas las Fotos',
      filterFb: 'Facebook (@AutoDetalladoGenesis)',
      filterIg: 'Instagram (@carroceria_pintura_genesis)',
      quoteBtn: 'Cotizar Trabajo Similar por WhatsApp',
    },
    en: {
      badge: 'Real Photos & Social Media',
      title: 'Real Workshop Photos',
      subtitle:
        'These original photographs were shared directly by the workshop. You can also visit our Facebook and Instagram profiles.',
      tabFeed: 'Workshop Photos',
      tabReel: 'Facebook Video Reel',
      tabPost: 'Official Facebook Post',
      addBtn: 'Add Social Media Photo',
      filterAll: 'All Photos',
      filterFb: 'Facebook (@AutoDetalladoGenesis)',
      filterIg: 'Instagram (@carroceria_pintura_genesis)',
      quoteBtn: 'Quote Similar Work via WhatsApp',
    },
  }[lang];

  return (
    <section id="redes-sociales" className="py-16 sm:py-24 bg-[#12141c] border-b border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{content.badge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-3">
            {content.title}
          </h2>
          <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
            {content.subtitle}
          </p>

          {/* Social Media Selector Tabs & Add Photo Button */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <button
              type="button"
              onClick={() => setActiveMedia('feed')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeMedia === 'feed'
                  ? 'bg-amber-500 text-neutral-950 shadow-md scale-105'
                  : 'bg-[#1a1d26] text-neutral-300 hover:text-white hover:bg-[#202430] border border-white/10'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{content.tabFeed} ({posts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMedia('reel')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeMedia === 'reel'
                  ? 'bg-amber-500 text-neutral-950 shadow-md scale-105'
                  : 'bg-[#1a1d26] text-neutral-300 hover:text-white hover:bg-[#202430] border border-white/10'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{content.tabReel}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMedia('post')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeMedia === 'post'
                  ? 'bg-amber-500 text-neutral-950 shadow-md scale-105'
                  : 'bg-[#1a1d26] text-neutral-300 hover:text-white hover:bg-[#202430] border border-white/10'
              }`}
            >
              <Facebook className="w-3.5 h-3.5" />
              <span>{content.tabPost}</span>
            </button>

            {/* Direct Button to Add Images from Social Networks */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer ml-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{content.addBtn}</span>
            </button>
          </div>
        </div>

        {/* View 1: Social Media Photo Feed Grid */}
        {activeMedia === 'feed' && (
          <div className="space-y-8">
            
            {/* Filter Bar (Facebook vs Instagram vs All) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151822] p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-neutral-400 ml-1" />
                <span className="text-xs text-neutral-400 font-medium mr-1 hidden sm:inline">
                  {lang === 'es' ? 'Filtrar por canal:' : 'Filter by channel:'}
                </span>

                <button
                  type="button"
                  onClick={() => setPlatformFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    platformFilter === 'all'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {content.filterAll} ({posts.length})
                </button>

                <button
                  type="button"
                  onClick={() => setPlatformFilter('workshop')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${platformFilter === 'workshop' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'}`}
                >
                  {lang === 'es' ? 'Taller' : 'Workshop'}
                </button>

                <button
                  type="button"
                  onClick={() => setPlatformFilter('facebook')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    platformFilter === 'facebook'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Facebook className="w-3.5 h-3.5" />
                  <span>Facebook</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlatformFilter('instagram')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    platformFilter === 'instagram'
                      ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </button>
              </div>

              {/* Direct Quick Add Trigger */}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{lang === 'es' ? '+ Subir o vincular foto' : '+ Upload or link photo'}</span>
              </button>
            </div>

            {filteredPosts.length === 0 && (
              <p className="text-center text-sm text-neutral-300 py-6">
                {lang === 'es' ? 'No hay fotos agregadas de este canal. Selecciona Todas las Fotos para ver las fotos del taller.' : 'No photos added for this channel. Select All Photos to see the workshop photos.'}
              </p>
            )}

            {/* Posts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post, idx) => (
                <div
                  key={post.id}
                  onClick={() => setActiveLightboxIndex(idx)}
                  className="bg-[#1a1d26] border border-white/10 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-md transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group cursor-pointer relative"
                >
                  <div>
                    {/* Post Top Channel Header */}
                    <div className="p-3.5 flex items-center justify-between border-b border-white/5 bg-[#14161f]">
                      <div className="flex items-center gap-2">
                        {post.platform === 'workshop' ? (
                          <Camera className="w-6 h-6 text-amber-400" />
                        ) : post.platform === 'facebook' ? (
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            f
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center text-[10px] shadow-sm">
                            <Instagram className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                            <span>{post.channelName}</span>
                            {post.isUserAdded && (
                              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] rounded font-semibold border border-emerald-500/30">
                                {lang === 'es' ? 'Reciente' : 'New'}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            Nogales, Sonora • {post.tag}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {post.isUserAdded && (
                          <button
                            type="button"
                            onClick={(e) => handleDeletePost(post.id, e)}
                            className="text-neutral-500 hover:text-rose-400 p-1 transition-colors"
                            title={lang === 'es' ? 'Eliminar de la lista' : 'Delete photo'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <a
                          href={post.channelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-neutral-400 hover:text-white p-1 transition-colors"
                          title="Abrir enlace oficial"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Post Image with Hover Overlay */}
                    <div className="relative aspect-[4/3] bg-black overflow-hidden">
                      <img
                        src={post.image}
                        loading="lazy"
                        alt={post.titleEs}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1d26]/85 via-transparent to-transparent opacity-60" />
                      
                      {/* Zoom Indicator */}
                      <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-3.5 h-3.5" />
                      </div>

                    </div>

                    {/* Post Caption */}
                    <div className="p-4 space-y-2">
                      <div className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        {lang === 'es' ? post.titleEs : post.titleEn}
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                        {lang === 'es' ? post.captionEs : post.captionEn}
                      </p>
                    </div>
                  </div>

                  {/* Post Footer with Direct WhatsApp Action */}
                  <div className="p-3.5 pt-0">
                    <a
                      href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(
                        lang === 'es'
                          ? `Hola Carrocería y Pintura Nogales, vi en su galería la foto de "${post.titleEs}" y me gustaría cotizar para mi vehículo.`
                          : `Hello, I saw your gallery photo of "${post.titleEn}" and would like a quote.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#12141c] hover:bg-amber-500 text-neutral-200 hover:text-neutral-950 border border-white/5 hover:border-amber-500 font-bold text-xs transition-all shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      <span>{content.quoteBtn}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Social Channels Bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-white/5">
              <a
                href={BUSINESS_INFO.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
              >
                <Facebook className="w-4 h-4 fill-white" />
                <span>Facebook: Auto Detallado Genesis</span>
              </a>

              <a
                href={BUSINESS_INFO.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram: @carroceria_pintura_genesis</span>
              </a>
            </div>
          </div>
        )}

        {/* View 2: Video Reel or Single Facebook Post (Original Live Embeds) */}
        {activeMedia !== 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            {/* Embed Container (6 cols) */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-[500px] bg-[#1a1d26] border border-white/10 rounded-2xl p-2 sm:p-3 shadow-xl relative overflow-hidden flex flex-col items-center">
                {activeMedia === 'reel' ? (
                  <div className="w-full max-w-[280px] overflow-hidden rounded-xl bg-black flex justify-center shadow-inner">
                    <iframe
                      src={FB_REEL_IFRAME_SRC}
                      width="267"
                      height="591"
                      style={{ border: 'none', overflow: 'hidden' }}
                      scrolling="no"
                      frameBorder="0"
                      allowFullScreen={true}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      title="Auto Detallado Genesis Facebook Reel Video"
                      className="rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-full overflow-hidden rounded-xl bg-white flex justify-center shadow-inner">
                    <iframe
                      src={FB_POST_IFRAME_SRC}
                      width="500"
                      height="660"
                      style={{ border: 'none', overflow: 'hidden' }}
                      scrolling="no"
                      frameBorder="0"
                      allowFullScreen={true}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      title="Auto Detallado Genesis Facebook Post"
                      className="w-full max-w-full rounded-lg"
                    />
                  </div>
                )}

                {/* Direct Link Footnote */}
                <div className="w-full pt-3 px-1 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="truncate pr-2">Auto Detallado Genesis</span>
                  <a
                    href={activeMedia === 'reel' ? FB_REEL_URL : FB_POST_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-semibold shrink-0"
                  >
                    <span>{activeMedia === 'reel' ? 'Ver Reel en Facebook' : 'Ver Post en Facebook'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Context & CTA Card (6 cols) */}
            <div className="lg:col-span-6 space-y-5">
              <div className="bg-[#1a1d26] border border-white/5 rounded-2xl p-6 sm:p-7 space-y-4 shadow-sm">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {activeMedia === 'reel' ? 'Video en Vivo' : 'Publicación Oficial'} • Auto Detallado Genesis
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight">
                  {activeMedia === 'reel'
                    ? (lang === 'es' ? 'Proceso de Detallado en Acción' : 'Detailing Process in Action')
                    : (lang === 'es' ? 'Trabajos y Resultados Recientes' : 'Recent Work & Results')}
                </h3>

                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {activeMedia === 'reel'
                    ? (lang === 'es'
                        ? 'Aprecia en video cómo nuestro equipo técnico trabaja la corrección de laca y pulido cerámico.'
                        : 'Watch our skilled technicians execute paint correction and ceramic gloss.')
                    : (lang === 'es'
                        ? 'Inspecciona las fotos detalladas, acabados al horno e igualación precisa de color automotriz.'
                        : 'Inspect high-resolution photos of oven-baked repainting and precision repair.')}
                </p>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start gap-2.5 text-xs text-neutral-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{lang === 'es' ? 'Documentación directa en nuestras instalaciones en Los Encinos' : 'Filmed directly at our workshop on José Zazueta #16'}</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{lang === 'es' ? 'Garantía por escrito en mano de obra y durabilidad' : 'Written warranty on workmanship and durability'}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-2.5 border-t border-white/5">
                  <a
                    href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(
                      lang === 'es'
                        ? 'Hola Carrocería y Pintura Nogales, vi su publicación en Facebook y me gustaría cotizar para mi vehículo.'
                        : 'Hello, I saw your Facebook post and would like to get a quote.'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-neutral-950" />
                    <span>{content.quoteBtn}</span>
                  </a>

                  <a
                    href={activeMedia === 'reel' ? FB_REEL_URL : FB_POST_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#12141c] hover:bg-[#202430] text-neutral-300 hover:text-white font-medium text-xs border border-white/10 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{lang === 'es' ? 'Abrir en Facebook' : 'Open in Facebook'}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: AGREGAR IMAGEN DE REDES SOCIALES */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#181b26] border border-white/10 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {lang === 'es' ? 'Agregar Imagen de Redes Sociales' : 'Add Social Media Image'}
                </h3>
                <p className="text-xs text-neutral-400">
                  {lang === 'es' ? 'Sube una foto o pega el enlace de Facebook / Instagram' : 'Upload an image or paste a Facebook / Instagram link'}
                </p>
              </div>
            </div>

            <form onSubmit={handleAddPost} className="space-y-4">
              {/* Platform Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {lang === 'es' ? 'Red Social de Origen' : 'Social Platform'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewPlatform('facebook')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      newPlatform === 'facebook'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-[#12141d] border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Facebook className="w-4 h-4" />
                    <span>Facebook (@AutoDetalladoGenesis)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPlatform('instagram')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      newPlatform === 'instagram'
                        ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 border-rose-500 text-white shadow-md'
                        : 'bg-[#12141d] border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Instagram className="w-4 h-4" />
                    <span>Instagram (@carroceria...)</span>
                  </button>
                </div>
              </div>

              {/* Image Input Options */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {lang === 'es' ? 'Subir Archivo de Imagen o URL' : 'Upload Image File or URL'}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-white/20 bg-[#12141d] hover:bg-[#1a1d28] text-neutral-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-amber-500" />
                    <span>{lang === 'es' ? 'Seleccionar archivo desde tu dispositivo' : 'Choose file from your device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="url"
                    placeholder={lang === 'es' ? 'O pega la URL directa de la imagen (https://...)' : 'Or paste direct image URL (https://...)'}
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#12141d] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500 placeholder:text-neutral-500"
                  />
                </div>

                {/* Preview Thumbnail */}
                {newImageUrl && (
                  <div className="mt-2 relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                    <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewImageUrl('')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {lang === 'es' ? 'Título del Trabajo' : 'Work Title'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'es' ? 'Ej. Silverado 2023 Acabado Cerámico' : 'E.g. Silverado 2023 Ceramic Finish'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12141d] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500 placeholder:text-neutral-500"
                  required
                />
              </div>

              {/* Caption / Description Input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {lang === 'es' ? 'Descripción o Texto del Post' : 'Post Caption / Description'}
                </label>
                <textarea
                  rows={2}
                  placeholder={lang === 'es' ? 'Comenta el proceso realizado, piezas o materiales...' : 'Describe the work, parts or materials...'}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#12141d] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500 placeholder:text-neutral-500 resize-none"
                />
              </div>

              {/* Link & Tag */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    {lang === 'es' ? 'Enlace del Post (Opcional)' : 'Post Link (Optional)'}
                  </label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/..."
                    value={newPostUrl}
                    onChange={(e) => setNewPostUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#12141d] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500 placeholder:text-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    {lang === 'es' ? 'Hashtag o Etiqueta' : 'Hashtag or Tag'}
                  </label>
                  <input
                    type="text"
                    placeholder="#DetalladoGenesis"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#12141d] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500 placeholder:text-neutral-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#12141d] hover:bg-[#1f2330] text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!newImageUrl}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    newImageUrl
                      ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md hover:scale-105'
                      : 'bg-white/10 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  {lang === 'es' ? 'Guardar y Mostrar en Galería' : 'Save & Publish to Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL: FULL RESOLUTION VIEWER */}
      {activeLightboxIndex !== null && filteredPosts[activeLightboxIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <button
            type="button"
            onClick={() => setActiveLightboxIndex(null)}
            className="absolute top-5 right-5 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50"
            aria-label="Cerrar visor"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveLightboxIndex(
                (prev) => ((prev ?? 0) - 1 + filteredPosts.length) % filteredPosts.length
              );
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveLightboxIndex(
                (prev) => ((prev ?? 0) + 1) % filteredPosts.length
              );
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full bg-[#181b26] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
            {/* Image on left/top */}
            <div className="md:w-3/5 bg-black flex items-center justify-center relative min-h-[320px] md:min-h-[500px]">
              <img
                src={filteredPosts[activeLightboxIndex].image}
                alt={filteredPosts[activeLightboxIndex].titleEs}
                className="max-h-[85vh] w-full object-contain"
              />
            </div>

            {/* Info on right */}
            <div className="md:w-2/5 p-6 flex flex-col justify-between overflow-y-auto bg-[#141620]">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {filteredPosts[activeLightboxIndex].platform === 'workshop' ? (
                    <Camera className="w-6 h-6 text-amber-400" />
                  ) : filteredPosts[activeLightboxIndex].platform === 'facebook' ? (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      f
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center text-[10px]">
                      <Instagram className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-white">
                      {filteredPosts[activeLightboxIndex].channelName}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Nogales, Sonora • {filteredPosts[activeLightboxIndex].tag}
                    </div>
                  </div>
                </div>

                <h4 className="text-base font-bold text-white tracking-tight">
                  {lang === 'es'
                    ? filteredPosts[activeLightboxIndex].titleEs
                    : filteredPosts[activeLightboxIndex].titleEn}
                </h4>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  {lang === 'es'
                    ? filteredPosts[activeLightboxIndex].captionEs
                    : filteredPosts[activeLightboxIndex].captionEn}
                </p>

              </div>

              <div className="pt-6 space-y-2 border-t border-white/5 mt-6">
                <a
                  href={`https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(
                    lang === 'es'
                      ? `Hola Carrocería y Pintura Nogales, me interesa cotizar un trabajo como "${filteredPosts[activeLightboxIndex].titleEs}".`
                      : `Hello, I'd like a quote for a job similar to "${filteredPosts[activeLightboxIndex].titleEn}".`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all hover:scale-105"
                >
                  <MessageCircle className="w-4 h-4 fill-neutral-950" />
                  <span>{content.quoteBtn}</span>
                </a>

                <a
                  href={filteredPosts[activeLightboxIndex].channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-medium text-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{filteredPosts[activeLightboxIndex].platform === 'workshop'
                    ? (lang === 'es' ? 'Visitar Facebook del taller' : 'Visit workshop Facebook')
                    : (lang === 'es' ? 'Ver en Red Social Original' : 'Open in Original Social Media')}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
