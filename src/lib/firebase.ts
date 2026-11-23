import { initializeApp } from 'firebase/app';
import {
  getAuth,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import { isVerifiedOwner, canUseAdministration } from './adminPolicy';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (CRITICAL REQUIREMENT)
const rawConfig = firebaseConfig as unknown as { firestoreDatabaseId?: string };
const firestoreDatabaseId =
  rawConfig.firestoreDatabaseId ||
  'ai-studio-remixremixremixp-2f705343-c737-41b5-bf0c-61e86a186964';
export const db = getFirestore(app, firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Structured Firestore Error Handling as mandated by Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Data Types
export interface StoredQuote {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  serviceType: string;
  description: string;
  estimatedRange: string;
  status: 'recibida' | 'en_revision' | 'presupuestada' | 'en_taller' | 'entregada';
  userId: string;
  adminNotes?: string;
  // Fotos adjuntas desde el cotizador web (hallazgos 2.1 y 2.2): se
  // guardan junto con la cotización porque el proyecto no tiene
  // Firebase Storage activado. `photoUrls` queda reservado para cuando
  // las fotos vivan en un alojamiento con URL pública.
  photoUrls?: string[];
  photoData?: string[];
  photoCount?: number;
  photoStorage?: 'inline' | 'none';
  source?: string;
  createdAt: any;
  updatedAt: any;
}

export interface StoredReview {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  vehicle?: string;
  userId: string;
  createdAt: any;
}

// Mensaje entrante de WhatsApp guardado por el webhook de Meta.
// `timestamp` es la hora del mensaje según Meta (segundos desde epoch);
// `receivedAt` es cuando lo guardó el servidor.
export interface StoredWhatsappMessage {
  id: string;
  wamid: string;
  from: string;
  type: string;
  text: string;
  timestamp: number;
  status: 'nuevo' | 'leido' | 'contestado';
  receivedAt: any;
}

// Google Auth Helpers
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Google Sign In error:', err);
    throw err;
  }
}

// Facebook Auth Helpers (for public reviews; same Firebase project as Google login)
export async function loginWithFacebook(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    return result.user;
  } catch (err) {
    console.error('Facebook Sign In error:', err);
    throw err;
  }
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// UI checks improve behavior; deployed Firestore rules remain the security boundary.
export async function requireAdministrator(): Promise<User> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) throw new Error('Acceso no autorizado.');
  if (isVerifiedOwner(user)) return user;
  const membership = await getDocFromServer(doc(db, 'admins', user.uid));
  if (auth.currentUser?.uid !== user.uid || !canUseAdministration(user, membership.exists())) {
    throw new Error('Acceso no autorizado.');
  }
  return user;
}

// Quotes Service
export async function saveQuote(quote: Omit<StoredQuote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  await requireAdministrator();
  const quoteId = 'cot-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const path = `quotes/${quoteId}`;
  try {
    const quoteRef = doc(db, 'quotes', quoteId);
    await setDoc(quoteRef, {
      ...quote,
      id: quoteId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return quoteId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToQuotes(onData: (quotes: StoredQuote[]) => void, onError?: (err: Error) => void) {
  let disposed = false;
  let unsubscribe = () => {};
  requireAdministrator().then(() => {
    if (disposed) return;
    unsubscribe = onSnapshot(
      query(collection(db, 'quotes'), orderBy('createdAt', 'desc')),
      snapshot => onData(snapshot.docs.map(item => item.data() as StoredQuote)),
      error => onError?.(error)
    );
  }).catch(error => { if (!disposed) { onData([]); onError?.(error); } });
  return () => { disposed = true; unsubscribe(); };
}

export async function updateQuoteStatus(quoteId: string, newStatus: StoredQuote['status'], adminNotes?: string) {
  await requireAdministrator();
  const path = `quotes/${quoteId}`;
  try {
    const updatePayload: Record<string, any> = {
      status: newStatus,
      updatedAt: serverTimestamp(),
    };
    if (adminNotes !== undefined) updatePayload.adminNotes = adminNotes;
    await updateDoc(doc(db, 'quotes', quoteId), updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Borrar una cotización (solo admin). Sirve para quitar solicitudes de
// prueba o spam del panel.
export async function deleteQuote(quoteId: string) {
  await requireAdministrator();
  const path = `quotes/${quoteId}`;
  try {
    await deleteDoc(doc(db, 'quotes', quoteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToWhatsappMessages(onData: (messages: StoredWhatsappMessage[]) => void, onError?: (err: Error) => void) {
  let disposed = false;
  let unsubscribe = () => {};
  requireAdministrator().then(() => {
    if (disposed) return;
    unsubscribe = onSnapshot(
      query(collection(db, 'whatsapp_messages'), orderBy('timestamp', 'desc')),
      snapshot => onData(snapshot.docs.map(item => item.data() as StoredWhatsappMessage)),
      error => onError?.(error)
    );
  }).catch(error => { if (!disposed) { onData([]); onError?.(error); } });
  return () => { disposed = true; unsubscribe(); };
}

export async function updateWhatsappMessageStatus(messageId: string, newStatus: StoredWhatsappMessage['status']) {
  await requireAdministrator();
  const path = `whatsapp_messages/${messageId}`;
  try {
    await updateDoc(doc(db, 'whatsapp_messages', messageId), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Reviews Service
export async function addReview(review: Omit<StoredReview, 'id' | 'createdAt'>): Promise<string> {
  const reviewId = 'rev-' + Date.now().toString(36);
  const path = `reviews/${reviewId}`;
  try {
    const revRef = doc(db, 'reviews', reviewId);
    await setDoc(revRef, {
      ...review,
      id: reviewId,
      createdAt: serverTimestamp(),
    });
    return reviewId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToReviews(onData: (reviews: StoredReview[]) => void, onError?: (err: Error) => void) {
  const path = 'reviews';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: StoredReview[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as StoredReview);
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );
}
