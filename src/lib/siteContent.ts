// Contenido editable desde el panel de administración (/administracion).
// Todo lo que se lee aquí es público: si Firestore falla, si las reglas
// todavía no permiten leer estas colecciones, o si aún no hay nada
// guardado, el sitio usa los valores fijos de content.ts sin mostrar
// ningún error. Nunca se muestra una sección vacía por esto.
import { useEffect, useState } from 'react';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import type { ServiceOverride, SiteContentOverride } from './firebase';

export type { ServiceOverride, SiteContentOverride };

export interface AdminGalleryPhoto {
  id: string;
  imageData: string;
  title: string;
  createdAt?: unknown;
  createdBy?: string;
}

export interface AdminWorkshopVideo {
  id: string;
  url: string;
  title: string;
  createdAt?: unknown;
  createdBy?: string;
}

// Lee el documento con los servicios, precios y horario editados por el
// admin. Devuelve null cuando no hay nada guardado o la lectura falla
// (por ejemplo, mientras las reglas de Firestore no están publicadas).
export function subscribeToSiteContent(onData: (data: SiteContentOverride | null) => void): () => void {
  try {
    return onSnapshot(
      doc(db, 'site_content', 'general'),
      (snap) => {
        onData(snap.exists() ? (snap.data() as SiteContentOverride) : null);
      },
      () => {
        onData(null);
      },
    );
  } catch {
    onData(null);
    return () => {};
  }
}

export function useSiteContent(): SiteContentOverride | null {
  const [data, setData] = useState<SiteContentOverride | null>(null);
  useEffect(() => subscribeToSiteContent(setData), []);
  return data;
}

export function findServiceOverride(
  overrides: ServiceOverride[] | undefined,
  id: string,
): ServiceOverride | undefined {
  return overrides?.find((o) => o.id === id);
}

// Fotos de la galería agregadas por el admin (primero las más recientes).
// Si la lectura falla, devuelve lista vacía y la galería muestra solo
// las fotos fijas de content.ts.
export function subscribeToGalleryPhotos(onData: (photos: AdminGalleryPhoto[]) => void): () => void {
  try {
    return onSnapshot(
      query(collection(db, 'gallery_photos'), orderBy('createdAt', 'desc')),
      (snap) => onData(snap.docs.map((d) => d.data() as AdminGalleryPhoto)),
      () => onData([]),
    );
  } catch {
    onData([]);
    return () => {};
  }
}

// Videos del taller agregados por el admin (primero los más recientes).
export function subscribeToWorkshopVideos(onData: (videos: AdminWorkshopVideo[]) => void): () => void {
  try {
    return onSnapshot(
      query(collection(db, 'workshop_videos'), orderBy('createdAt', 'desc')),
      (snap) => onData(snap.docs.map((d) => d.data() as AdminWorkshopVideo)),
      () => onData([]),
    );
  } catch {
    onData([]);
    return () => {};
  }
}
