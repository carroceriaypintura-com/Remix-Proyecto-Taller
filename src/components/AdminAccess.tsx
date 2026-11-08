import { lazy, Suspense, useEffect, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser, requireAdministrator } from '../lib/firebase';

const GoogleWorkspaceHub = lazy(() => import('./GoogleWorkspaceHub'));

export default function AdminAccess() {
  const [status, setStatus] = useState<'checking' | 'signed-out' | 'denied' | 'allowed'>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    let generation = 0;
    const stop = onIdTokenChanged(auth, async user => {
      const current = ++generation;
      setStatus('checking');
      if (!user) { setStatus('signed-out'); return; }
      try {
        await requireAdministrator();
        if (generation === current) setStatus('allowed');
      } catch {
        if (generation === current) setStatus('denied');
      }
    });
    return () => { generation++; stop(); robots.remove(); };
  }, []);

  async function signIn() {
    setError('');
    try { await loginWithGoogle(); }
    catch { setError('No se pudo iniciar sesión. Intenta nuevamente.'); }
  }

  return (
    <main className="min-h-screen bg-[#07090c] text-white p-6 flex items-center justify-center">
      {status === 'allowed' ? (
        <Suspense fallback={<p>Cargando administración…</p>}>
          <GoogleWorkspaceHub isOpen onClose={() => { window.location.href = '/'; }} />
        </Suspense>
      ) : (
        <section className="max-w-md space-y-5 rounded-2xl border border-white/10 p-6">
          <h1 className="text-2xl font-bold">Acceso privado</h1>
          {status === 'checking' && <p>Verificando permisos…</p>}
          {status === 'signed-out' && <>
            <p>Solo el propietario y las personas autorizadas pueden ingresar.</p>
            <button className="action-pill action-blue" onClick={signIn}>Iniciar sesión</button>
          </>}
          {status === 'denied' && <>
            <p role="alert">Tu cuenta no tiene permisos de administración.</p>
            <button className="action-pill action-blue" onClick={() => { void logoutUser(); }}>Cerrar sesión</button>
          </>}
          {error && <p role="alert">{error}</p>}
          <a className="block underline" href="/">Volver al sitio público</a>
        </section>
      )}
    </main>
  );
}
