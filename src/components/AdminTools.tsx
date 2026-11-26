// Herramientas del administrador: pestaña "Herramientas" del panel
// Taller Digital (/administracion). Solo se muestra dentro del panel,
// que ya exige inicio de sesión con Google y cuenta autorizada
// (requireAdministrator). Nada de esto es visible en el sitio público.
import { useEffect, useId, useRef, useState } from 'react';
import {
  Images,
  Video,
  Wrench,
  Upload,
  Trash2,
  Save,
  RotateCcw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SERVICES_LIST, BUSINESS_INFO } from '../data/content';
import { COMMON_SERVICES } from './QuoteEstimator';
import {
  saveGalleryPhoto,
  deleteGalleryPhoto,
  subscribeToGalleryPhotosAdmin,
  StoredGalleryPhoto,
  saveWorkshopVideo,
  deleteWorkshopVideo,
  subscribeToWorkshopVideosAdmin,
  StoredWorkshopVideo,
  saveSiteContent,
  deleteSiteContent,
  ServiceOverride,
  SiteContentOverride,
} from '../lib/firebase';
import { subscribeToSiteContent } from '../lib/siteContent';

interface AdminToolsProps {
  user: User | null;
  notify: (type: 'success' | 'error', message: string) => void;
}

// Reduce la foto a un tamaño apto para guardarla en Firestore junto con
// la galería (máx. 1200 px por el lado mayor, JPEG). Una foto de celular
// de 12 MP queda normalmente entre 150 y 350 KB después de este paso,
// muy por debajo del límite de 1 MB por documento de Firestore.
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

async function downscalePhoto(file: File): Promise<string> {
  const src = await fileToDataUrl(file);
  const img = await loadImage(src);
  const maxDim = 1200;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la foto.');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/permission-denied|PERMISSION_DENIED|Acceso no autorizado/i.test(msg)) {
    return 'Sin permisos: falta publicar las reglas nuevas de Firestore en la consola de Firebase. El cambio no se guardó.';
  }
  return 'No se pudo guardar. Inténtalo de nuevo.';
}

interface SiteServiceForm {
  id: string;
  title: string;
  desc: string;
  time: string;
}

interface QuotePriceForm {
  id: string;
  title: string;
  minMxn: string;
  maxMxn: string;
}

function staticSiteServices(): SiteServiceForm[] {
  return SERVICES_LIST.map((s) => ({ id: s.number, title: s.title, desc: s.desc, time: s.time }));
}

function staticQuotePrices(): QuotePriceForm[] {
  return COMMON_SERVICES.map((s) => ({
    id: s.id,
    title: s.nameEs,
    minMxn: String(s.minMxn),
    maxMxn: String(s.maxMxn),
  }));
}

export default function AdminTools({ user, notify }: AdminToolsProps) {
  const photoInputId = useId();

  // Fotos de la galería
  const [photos, setPhotos] = useState<StoredGalleryPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Videos del taller
  const [videos, setVideos] = useState<StoredWorkshopVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);

  // Servicios, precios y horario
  const [siteServices, setSiteServices] = useState<SiteServiceForm[]>(staticSiteServices);
  const [quotePrices, setQuotePrices] = useState<QuotePriceForm[]>(staticQuotePrices);
  const [hoursWeekday, setHoursWeekday] = useState(BUSINESS_INFO.hoursWeekday);
  const [hoursDetailing, setHoursDetailing] = useState(BUSINESS_INFO.hoursDetailing);
  const [siteContent, setSiteContent] = useState<SiteContentOverride | null>(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  const formPopulated = useRef(false);
  const [savingContent, setSavingContent] = useState(false);

  useEffect(() => {
    if (!user) {
      setPhotos([]);
      setVideos([]);
      setLoadingPhotos(false);
      setLoadingVideos(false);
      return;
    }
    setLoadingPhotos(true);
    const unsubPhotos = subscribeToGalleryPhotosAdmin(
      (items) => {
        setPhotos(items);
        setLoadingPhotos(false);
      },
      (err) => {
        console.warn('Firestore gallery_photos:', err);
        setLoadingPhotos(false);
      },
    );
    setLoadingVideos(true);
    const unsubVideos = subscribeToWorkshopVideosAdmin(
      (items) => {
        setVideos(items);
        setLoadingVideos(false);
      },
      (err) => {
        console.warn('Firestore workshop_videos:', err);
        setLoadingVideos(false);
      },
    );
    return () => {
      unsubPhotos();
      unsubVideos();
    };
  }, [user]);

  // Contenido editable actual del sitio (para llenar el formulario).
  useEffect(() => {
    return subscribeToSiteContent((data) => {
      setSiteContent(data);
      setContentLoaded(true);
    });
  }, []);

  // Llena el formulario una sola vez con lo que ya está guardado.
  useEffect(() => {
    if (!contentLoaded || formPopulated.current) return;
    formPopulated.current = true;
    if (!siteContent) return;
    const overrides = siteContent.services ?? [];
    setSiteServices(
      SERVICES_LIST.map((s) => {
        const o = overrides.find((item) => item.id === s.number);
        return {
          id: s.number,
          title: o?.title ?? s.title,
          desc: o?.desc ?? s.desc,
          time: o?.time ?? s.time,
        };
      }),
    );
    setQuotePrices(
      COMMON_SERVICES.map((s) => {
        const o = overrides.find((item) => item.id === s.id);
        return {
          id: s.id,
          title: o?.title ?? s.nameEs,
          minMxn: o?.minMxn !== undefined ? String(o.minMxn) : String(s.minMxn),
          maxMxn: o?.maxMxn !== undefined ? String(o.maxMxn) : String(s.maxMxn),
        };
      }),
    );
    if (siteContent.hoursWeekday) setHoursWeekday(siteContent.hoursWeekday);
    if (siteContent.hoursDetailing) setHoursDetailing(siteContent.hoursDetailing);
  }, [contentLoaded, siteContent]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const imageData = await downscalePhoto(file);
      // La URL de datos en base64 ocupa ~1.37x el tamaño del JPEG.
      if (imageData.length > 950_000) {
        notify('error', 'La foto quedó muy pesada aun reducida. Prueba con otra foto.');
        return;
      }
      await saveGalleryPhoto(imageData, newPhotoTitle.trim() || 'Foto del taller');
      setNewPhotoTitle('');
      notify('success', 'Foto agregada a la galería. Ya se ve en el sitio.');
    } catch (err) {
      notify('error', friendlyError(err));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddVideo = async () => {
    const url = newVideoUrl.trim();
    if (!url.startsWith('https://')) {
      notify('error', 'Pega el enlace completo del video, que empiece con https://');
      return;
    }
    setSavingVideo(true);
    try {
      await saveWorkshopVideo(url, newVideoTitle.trim() || 'Video del taller');
      setNewVideoUrl('');
      setNewVideoTitle('');
      notify('success', 'Video agregado. Ya se ve en la sección de videos.');
    } catch (err) {
      notify('error', friendlyError(err));
    } finally {
      setSavingVideo(false);
    }
  };

  const handleSaveContent = async () => {
    // Solo se guardan los valores que difieren de los fijos del sitio.
    const serviceDiffs: ServiceOverride[] = [];
    siteServices.forEach((s, i) => {
      const orig = SERVICES_LIST[i];
      const o: ServiceOverride = { id: s.id };
      if (s.title.trim() && s.title.trim() !== orig.title) o.title = s.title.trim();
      if (s.desc.trim() !== orig.desc) o.desc = s.desc.trim();
      if (s.time.trim() && s.time.trim() !== orig.time) o.time = s.time.trim();
      if (o.title !== undefined || o.desc !== undefined || o.time !== undefined) serviceDiffs.push(o);
    });
    for (let i = 0; i < quotePrices.length; i++) {
      const p = quotePrices[i];
      const orig = COMMON_SERVICES[i];
      const min = parseInt(p.minMxn, 10);
      const max = parseInt(p.maxMxn, 10);
      if (!p.title.trim()) {
        notify('error', `Falta el nombre del servicio de precios "${orig.nameEs}".`);
        return;
      }
      if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0 || max < min) {
        notify('error', `Revisa los precios de "${p.title}": el mínimo y el máximo deben ser números y el máximo no puede ser menor que el mínimo.`);
        return;
      }
      const o: ServiceOverride = { id: p.id };
      if (p.title.trim() !== orig.nameEs) o.title = p.title.trim();
      if (min !== orig.minMxn) o.minMxn = min;
      if (max !== orig.maxMxn) o.maxMxn = max;
      if (o.title !== undefined || o.minMxn !== undefined || o.maxMxn !== undefined) serviceDiffs.push(o);
    }
    const payload: Omit<SiteContentOverride, 'updatedAt'> = {};
    if (serviceDiffs.length > 0) payload.services = serviceDiffs;
    if (hoursWeekday.trim() && hoursWeekday.trim() !== BUSINESS_INFO.hoursWeekday) {
      payload.hoursWeekday = hoursWeekday.trim();
    }
    if (hoursDetailing.trim() && hoursDetailing.trim() !== BUSINESS_INFO.hoursDetailing) {
      payload.hoursDetailing = hoursDetailing.trim();
    }

    setSavingContent(true);
    try {
      if (Object.keys(payload).length === 0) {
        await deleteSiteContent();
        notify('success', 'Todo ya estaba en los valores originales. Se quitó el contenido editado.');
      } else {
        await saveSiteContent(payload);
        notify('success', 'Cambios guardados. Ya se ven en el sitio.');
      }
    } catch (err) {
      notify('error', friendlyError(err));
    } finally {
      setSavingContent(false);
    }
  };

  const handleResetContent = async () => {
    if (!window.confirm('¿Restablecer servicios, precios y horario a los valores originales del sitio? Se borran tus cambios.')) return;
    setSavingContent(true);
    try {
      await deleteSiteContent();
      setSiteServices(staticSiteServices());
      setQuotePrices(staticQuotePrices());
      setHoursWeekday(BUSINESS_INFO.hoursWeekday);
      setHoursDetailing(BUSINESS_INFO.hoursDetailing);
      notify('success', 'Valores restablecidos a los originales.');
    } catch (err) {
      notify('error', friendlyError(err));
    } finally {
      setSavingContent(false);
    }
  };

  if (!user) {
    return (
      <div className="py-12 px-4 text-center rounded-xl bg-[#121620] border border-dashed border-white/10 space-y-3 max-w-md mx-auto">
        <Wrench className="w-8 h-8 text-amber-400 mx-auto" />
        <div className="text-sm font-bold text-white">Inicia sesión para usar las herramientas</div>
        <p className="text-xs text-neutral-400">
          Las herramientas del taller solo están disponibles con tu cuenta de taller autorizada.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-[#121620] border border-white/10">
        <div>
          <h4 className="text-sm font-bold text-white">Herramientas del taller</h4>
          <p className="text-xs text-neutral-400">
            Solo tú puedes usar esta pestaña. Lo que guardes aquí se publica en el sitio al momento.
          </p>
        </div>
        <div className="text-xs text-amber-400 font-bold">
          {photos.length} fotos · {videos.length} videos agregados
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Si al guardar aparece un error de permisos, es porque falta publicar las reglas nuevas de
          Firestore en la consola de Firebase. El cambio no se guarda hasta que esas reglas estén publicadas.
        </span>
      </div>

      {/* HERRAMIENTA 1: FOTOS DE LA GALERÍA */}
      <section className="p-4 rounded-xl bg-[#121620] border border-white/10 space-y-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Images className="w-4 h-4 text-purple-400" /> Fotos de la galería
          </h4>
          <p className="text-xs text-neutral-400">
            Sube fotos de tus trabajos. Aparecen primero en la galería del sitio, antes de las fotos fijas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newPhotoTitle}
            onChange={(e) => setNewPhotoTitle(e.target.value)}
            placeholder="Título de la foto (opcional)"
            className="flex-1 px-3 py-2.5 rounded-xl bg-[#181d2a] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500 placeholder:text-neutral-500"
          />
          <label
            htmlFor={photoInputId}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
              uploadingPhoto ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{uploadingPhoto ? 'Subiendo...' : 'Seleccionar foto'}</span>
          </label>
          <input
            id={photoInputId}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        {loadingPhotos ? (
          <div className="py-8 text-center text-xs text-neutral-400">Cargando fotos...</div>
        ) : photos.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-500 bg-[#181d2a] rounded-xl border border-dashed border-white/10">
            Aún no agregas fotos. La galería muestra por ahora solo las fotos fijas del sitio.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto">
            {photos.map((p) => (
              <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 bg-black">
                <img src={p.imageData} alt={p.title} className="aspect-square w-full object-cover" />
                <div className="flex items-center justify-between gap-1 p-2">
                  <span className="text-[11px] text-neutral-200 truncate">{p.title}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar la foto "${p.title}" de la galería?`)) {
                        deleteGalleryPhoto(p.id).catch((err) => notify('error', friendlyError(err)));
                      }
                    }}
                    className="p-1 rounded text-rose-400 hover:bg-rose-500/20 shrink-0"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* HERRAMIENTA 2: VIDEOS DEL TALLER */}
      <section className="p-4 rounded-xl bg-[#121620] border border-white/10 space-y-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-amber-400" /> Videos del taller
          </h4>
          <p className="text-xs text-neutral-400">
            Primero sube el video desde tu celular a R2 y luego pega aquí el enlace. Los videos que
            agregues aparecen primero en la sección de videos del sitio.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={newVideoTitle}
            onChange={(e) => setNewVideoTitle(e.target.value)}
            placeholder="Título del video (opcional)"
            className="px-3 py-2.5 rounded-xl bg-[#181d2a] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500 placeholder:text-neutral-500"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="Enlace del video en R2 (https://pub-....r2.dev/....mp4)"
              className="flex-1 px-3 py-2.5 rounded-xl bg-[#181d2a] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500 placeholder:text-neutral-500"
            />
            <button
              type="button"
              onClick={handleAddVideo}
              disabled={savingVideo}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Video className="w-4 h-4" />
              <span>{savingVideo ? 'Agregando...' : 'Agregar video'}</span>
            </button>
          </div>
        </div>

        {loadingVideos ? (
          <div className="py-8 text-center text-xs text-neutral-400">Cargando videos...</div>
        ) : videos.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-500 bg-[#181d2a] rounded-xl border border-dashed border-white/10">
            Aún no agregas videos. La sección muestra por ahora solo los videos fijos del sitio.
          </div>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {videos.map((v) => (
              <div key={v.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#181d2a] border border-white/5 text-xs">
                <Video className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{v.title}</div>
                  <div className="text-neutral-400 truncate">{v.url}</div>
                </div>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded text-neutral-300 hover:text-white shrink-0"
                  title="Abrir video"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar el video "${v.title}"?`)) {
                      deleteWorkshopVideo(v.id).catch((err) => notify('error', friendlyError(err)));
                    }
                  }}
                  className="p-1.5 rounded text-rose-400 hover:bg-rose-500/20 shrink-0"
                  title="Eliminar video"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* HERRAMIENTA 3: SERVICIOS, PRECIOS Y HORARIO */}
      <section className="p-4 rounded-xl bg-[#121620] border border-white/10 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-400" /> Servicios, precios y horario
          </h4>
          <p className="text-xs text-neutral-400">
            Edita lo que se ve en el sitio y en el cotizador. Si dejas un campo igual al original, no
            se guarda nada de ese campo.
          </p>
        </div>

        <div className="space-y-2">
          <h5 className="text-xs font-bold text-neutral-200">Servicios del sitio</h5>
          {siteServices.map((s, i) => (
            <div key={s.id} className="p-3 rounded-xl bg-[#181d2a] border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold shrink-0">
                  Servicio {parseInt(s.id, 10) || i + 1}
                </span>
                <input
                  type="text"
                  value={s.title}
                  onChange={(e) =>
                    setSiteServices((prev) => prev.map((item, idx) => (idx === i ? { ...item, title: e.target.value } : item)))
                  }
                  placeholder="Nombre del servicio"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-[#121620] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  value={s.time}
                  onChange={(e) =>
                    setSiteServices((prev) => prev.map((item, idx) => (idx === i ? { ...item, time: e.target.value } : item)))
                  }
                  placeholder="Duración"
                  className="w-28 px-3 py-2 rounded-lg bg-[#121620] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <textarea
                value={s.desc}
                onChange={(e) =>
                  setSiteServices((prev) => prev.map((item, idx) => (idx === i ? { ...item, desc: e.target.value } : item)))
                }
                rows={2}
                placeholder="Descripción del servicio"
                className="w-full px-3 py-2 rounded-lg bg-[#121620] border border-white/10 text-neutral-200 text-xs focus:outline-none focus:border-amber-500 resize-y"
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h5 className="text-xs font-bold text-neutral-200">Precios del cotizador (MXN)</h5>
          {quotePrices.map((p, i) => (
            <div key={p.id} className="grid grid-cols-[1fr_84px_84px] sm:grid-cols-[1fr_110px_110px] gap-2 items-center p-2.5 rounded-xl bg-[#181d2a] border border-white/5">
              <input
                type="text"
                value={p.title}
                onChange={(e) =>
                  setQuotePrices((prev) => prev.map((item, idx) => (idx === i ? { ...item, title: e.target.value } : item)))
                }
                placeholder="Servicio"
                className="min-w-0 px-3 py-2 rounded-lg bg-[#121620] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
              />
              <label className="flex items-center gap-1 text-[10px] text-neutral-400">
                <span className="shrink-0">Mín $</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={p.minMxn}
                  onChange={(e) =>
                    setQuotePrices((prev) => prev.map((item, idx) => (idx === i ? { ...item, minMxn: e.target.value } : item)))
                  }
                  className="w-full min-w-0 px-2 py-2 rounded-lg bg-[#121620] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </label>
              <label className="flex items-center gap-1 text-[10px] text-neutral-400">
                <span className="shrink-0">Máx $</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={p.maxMxn}
                  onChange={(e) =>
                    setQuotePrices((prev) => prev.map((item, idx) => (idx === i ? { ...item, maxMxn: e.target.value } : item)))
                  }
                  className="w-full min-w-0 px-2 py-2 rounded-lg bg-[#121620] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </label>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h5 className="text-xs font-bold text-neutral-200">Horario</h5>
          <input
            type="text"
            value={hoursWeekday}
            onChange={(e) => setHoursWeekday(e.target.value)}
            placeholder="Horario del taller"
            className="w-full px-3 py-2.5 rounded-xl bg-[#181d2a] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
          />
          <input
            type="text"
            value={hoursDetailing}
            onChange={(e) => setHoursDetailing(e.target.value)}
            placeholder="Horario de detallado"
            className="w-full px-3 py-2.5 rounded-xl bg-[#181d2a] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={handleSaveContent}
            disabled={savingContent}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{savingContent ? 'Guardando...' : 'Guardar cambios'}</span>
          </button>
          <button
            type="button"
            onClick={handleResetContent}
            disabled={savingContent}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restablecer valores</span>
          </button>
        </div>
      </section>
    </div>
  );
}
