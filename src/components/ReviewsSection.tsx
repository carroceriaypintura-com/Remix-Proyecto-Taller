import { useEffect, useState } from 'react';
import { Star, LogOut, CheckCircle2 } from 'lucide-react';
import type { User } from 'firebase/auth';
import { Language } from '../types';
import {
  StoredReview,
  addReview,
  loginWithFacebook,
  loginWithGoogle,
  logoutUser,
  onAuthChange,
  subscribeToReviews,
} from '../lib/firebase';

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'auth/operation-not-allowed')
    return 'El inicio con Facebook aún no está activado, prueba con Google por ahora.';
  if (code === 'auth/popup-closed-by-user')
    return 'Se cerró la ventana de inicio de sesión, inténtalo de nuevo.';
  if (code === 'auth/unauthorized-domain')
    return 'Este dominio aún no está autorizado para entrar, prueba desde el sitio en vivo.';
  if (code === 'auth/popup-blocked')
    return 'El navegador bloqueó la ventana, permite las ventanas emergentes e inténtalo de nuevo.';
  return 'No se pudo iniciar sesión, inténtalo de nuevo.';
}

function formatReviewDate(createdAt: unknown): string {
  try {
    const date =
      (createdAt as { toDate?: () => Date })?.toDate?.() ??
      ((createdAt as { seconds?: number })?.seconds
        ? new Date((createdAt as { seconds: number }).seconds * 1000)
        : null);
    return date
      ? date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
  } catch {
    return '';
  }
}

function Stars({ value, size }: { value: number; size: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-7 h-7' : 'w-4 h-4';
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${n <= value ? 'text-amber-400' : 'text-neutral-600'}`}
          fill={n <= value ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}

export default function ReviewsSection({ lang }: { lang: Language }) {
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [rating, setRating] = useState(0);
  const [authorName, setAuthorName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthChange((currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName) {
        setAuthorName((prev) => prev || currentUser.displayName || '');
      }
    });
    const unsubscribeReviews = subscribeToReviews(setReviews);
    return () => {
      unsubscribeAuth();
      unsubscribeReviews();
    };
  }, []);

  async function handleLogin(provider: 'facebook' | 'google') {
    setLoginError('');
    setLoggingIn(true);
    try {
      const loggedUser =
        provider === 'facebook' ? await loginWithFacebook() : await loginWithGoogle();
      if (loggedUser.displayName) {
        setAuthorName((prev) => prev || loggedUser.displayName || '');
      }
    } catch (err) {
      setLoginError(friendlyAuthError(err));
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (rating === 0) {
      setFormError(lang === 'es' ? 'Elige de 1 a 5 estrellas.' : 'Choose 1 to 5 stars.');
      return;
    }
    if (!authorName.trim()) {
      setFormError(lang === 'es' ? 'Escribe tu nombre.' : 'Write your name.');
      return;
    }
    if (!comment.trim()) {
      setFormError(lang === 'es' ? 'Escribe tu reseña.' : 'Write your review.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const payload: Omit<StoredReview, 'id' | 'createdAt'> = {
        authorName: authorName.trim(),
        rating,
        comment: comment.trim(),
        userId: user.uid,
      };
      if (vehicle.trim()) payload.vehicle = vehicle.trim();
      await addReview(payload);
      setSent(true);
      setComment('');
      setVehicle('');
      setRating(0);
    } catch {
      setFormError(
        lang === 'es'
          ? 'No se pudo guardar tu reseña, inténtalo de nuevo.'
          : 'Your review could not be saved, try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="resenas" className="py-8 sm:py-12 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {lang === 'es' ? 'Reseñas de clientes' : 'Customer reviews'}
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              {lang === 'es'
                ? 'Lo que dicen quienes ya pasaron por el taller.'
                : 'What customers say after visiting the shop.'}
            </p>
          </div>
          <span className="text-sm text-neutral-400">
            {reviews.length === 0
              ? lang === 'es'
                ? 'Aún no hay reseñas'
                : 'No reviews yet'
              : `${reviews.length} ${lang === 'es' ? (reviews.length === 1 ? 'reseña' : 'reseñas') : reviews.length === 1 ? 'review' : 'reviews'}`}
          </span>
        </div>

        {reviews.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#10141d] p-5 text-sm text-neutral-300 mb-6">
            {lang === 'es'
              ? 'Aún no hay reseñas publicadas. Sé el primero en dejar la tuya.'
              : 'No reviews published yet. Be the first to leave yours.'}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {reviews.map((review) => {
              const date = formatReviewDate(review.createdAt);
              return (
                <article
                  key={review.id}
                  className="rounded-2xl border border-white/10 bg-[#10141d] p-4"
                >
                  <Stars value={review.rating} size="sm" />
                  <p className="text-sm text-neutral-200 mt-2">{review.comment}</p>
                  <p className="mt-3 text-xs text-neutral-400">
                    {review.authorName}
                    {review.vehicle ? ` · ${review.vehicle}` : ''}
                    {date ? ` · ${date}` : ''}
                  </p>
                </article>
              );
            })}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-[#10141d] p-5">
          {!user ? (
            <div>
              <h3 className="font-bold text-lg">
                {lang === 'es' ? 'Deja tu reseña' : 'Leave your review'}
              </h3>
              <p className="text-sm text-neutral-400 mt-1 mb-4">
                {lang === 'es'
                  ? 'Entra con tu cuenta para publicar tu reseña. No publicamos tu correo.'
                  : 'Sign in with your account to post your review. We do not publish your email.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleLogin('facebook')}
                  disabled={loggingIn}
                  className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-white bg-[#1877F2] hover:bg-[#166fe5] border border-blue-400/30 transition-all hover:scale-105 disabled:opacity-60"
                >
                  <i className="fa-brands fa-facebook-f text-sm" aria-hidden="true"></i>
                  {lang === 'es' ? 'Entrar con Facebook' : 'Continue with Facebook'}
                </button>
                <button
                  type="button"
                  onClick={() => handleLogin('google')}
                  disabled={loggingIn}
                  className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-neutral-900 bg-white hover:bg-neutral-200 border border-white/30 transition-all hover:scale-105 disabled:opacity-60"
                >
                  <i className="fa-brands fa-google text-sm" aria-hidden="true"></i>
                  {lang === 'es' ? 'Entrar con Google' : 'Continue with Google'}
                </button>
              </div>
              {loginError && <p className="text-sm text-rose-400 mt-3">{loginError}</p>}
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <p className="text-sm text-neutral-300">
                  {lang === 'es' ? 'Escribiendo como ' : 'Posting as '}
                  <span className="font-bold text-white">
                    {user.displayName || user.email || (lang === 'es' ? 'cliente' : 'customer')}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => logoutUser()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white px-3 py-2 rounded-full border border-white/15"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {lang === 'es' ? 'Salir' : 'Sign out'}
                </button>
              </div>

              {sent ? (
                <p className="flex items-center gap-2 text-sm text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  {lang === 'es'
                    ? '¡Gracias por tu reseña! Ya quedó publicada.'
                    : 'Thanks for your review! It is now published.'}
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div>
                    <span className="block text-xs font-semibold text-neutral-400 mb-1">
                      {lang === 'es' ? 'Tu calificación' : 'Your rating'}
                    </span>
                    <div className="flex gap-1" role="radiogroup" aria-label="Calificación">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          aria-label={`${n} ${lang === 'es' ? 'estrellas' : 'stars'}`}
                          className="p-1"
                        >
                          <Star
                            className={`w-7 h-7 ${n <= rating ? 'text-amber-400' : 'text-neutral-600'}`}
                            fill={n <= rating ? 'currentColor' : 'none'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="block text-xs font-semibold text-neutral-400 mb-1">
                        {lang === 'es' ? 'Tu nombre' : 'Your name'}
                      </span>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(event) => setAuthorName(event.target.value)}
                        maxLength={60}
                        className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-2 focus:outline-amber-400"
                        placeholder={lang === 'es' ? 'Como quieres que aparezca' : 'As you want it to appear'}
                      />
                    </label>
                    <label className="block">
                      <span className="block text-xs font-semibold text-neutral-400 mb-1">
                        {lang === 'es' ? 'Tu carro (opcional)' : 'Your car (optional)'}
                      </span>
                      <input
                        type="text"
                        value={vehicle}
                        onChange={(event) => setVehicle(event.target.value)}
                        maxLength={60}
                        className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-2 focus:outline-amber-400"
                        placeholder={lang === 'es' ? 'Ej. Jeep Gladiator 2023' : 'E.g. Jeep Gladiator 2023'}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="block text-xs font-semibold text-neutral-400 mb-1">
                      {lang === 'es' ? 'Tu reseña' : 'Your review'}
                    </span>
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      maxLength={500}
                      rows={3}
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-2 focus:outline-amber-400"
                      placeholder={
                        lang === 'es'
                          ? 'Cuéntanos cómo te fue con tu carro…'
                          : 'Tell us how it went with your car…'
                      }
                    />
                  </label>

                  {formError && <p className="text-sm text-rose-400">{formError}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="action-pill action-purple self-start disabled:opacity-60"
                  >
                    {submitting
                      ? lang === 'es'
                        ? 'Publicando…'
                        : 'Publishing…'
                      : lang === 'es'
                        ? 'Publicar mi reseña'
                        : 'Publish my review'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
