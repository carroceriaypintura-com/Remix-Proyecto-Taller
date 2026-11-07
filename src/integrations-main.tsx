import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser } from './lib/firebase';
import './index.css';

const providers = [
  { id: 'notion', name: 'Notion (MCP)' },
  { id: 'airefs', name: 'Airefs' },
  { id: 'adobe', name: 'Adobe Express' },
  { id: 'snowflake', name: 'Snowflake (WIF)' },
] as const;
const messages: Record<string, string> = {
  authentication_required: 'Inicia sesión de nuevo para comprobar tu conexión.',
  authorization_required: 'Debes autorizar esta cuenta. Pulsa Preparar autorización.',
  installation_required: 'Falta completar la instalación en el proveedor.',
  connector_not_configured: 'Falta configurar o vincular el conector. Snowflake necesita su cuenta e identidad federada.',
  provider_unavailable: 'El proveedor no está disponible. Inténtalo más tarde.',
  forbidden: 'Solo el administrador del taller con correo verificado puede comprobar Snowflake.',
  federation_setup_required: 'La federación de Snowflake debe configurarse con su administrador.',
};

function ProviderCard({ provider, user }: { provider: typeof providers[number]; user: User }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Pendiente de comprobación con tu cuenta.');
  const [consentUrl, setConsentUrl] = useState<string | null>(null);
  async function check(authorize = false) {
    setBusy(true);
    setConsentUrl(null);
    try {
      // This is the application's Firebase ID token, never a provider credential.
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/connect?provider=${provider.id}`, {
        method: authorize ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
        cache: 'no-store',
      });
      const result = await response.json();
      if (response.ok && authorize) {
        const url = new URL(result.authorizationUrl);
        if (url.protocol !== 'https:') throw new Error('Invalid consent URL');
        setConsentUrl(url.href);
        setMessage('Abre el enlace, autoriza tu cuenta y vuelve aquí para comprobarla.');
      } else if (response.ok && result.status === 'credential_available') {
        setMessage('Credencial disponible en el servidor. Aún no se ha probado ninguna operación con datos del proveedor.');
      } else {
        setMessage(messages[result.error] || 'No se pudo comprobar la conexión.');
      }
    } catch {
      setMessage('No se pudo completar la solicitud. Revisa tu sesión y vuelve a intentarlo.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-2xl border border-white/15 bg-neutral-900 p-5">
      <h2 className="text-xl font-bold">{provider.name}</h2>
      <p className="mt-1 text-sm text-neutral-400">acme-{provider.id}</p>
      <p className="my-4 text-sm text-neutral-200" role="status">{message}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={() => check()}
          className="rounded-xl bg-emerald-400 px-4 py-3 font-bold text-black disabled:opacity-50">
          {busy ? 'Esperando…' : 'Comprobar'}
        </button>
        {provider.id !== 'snowflake' && <button type="button" disabled={busy} onClick={() => check(true)}
          className="rounded-xl border border-white/30 px-4 py-3 disabled:opacity-50">Preparar autorización</button>}
        {consentUrl && <a href={consentUrl} target="_blank" rel="noopener noreferrer"
          className="rounded-xl bg-blue-600 px-4 py-3 font-bold">Autorizar mi cuenta ↗</a>}
      </div>
    </section>
  );
}

function Integrations() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  useEffect(() => onAuthStateChanged(auth, current => {
    setUser(current);
    setChecking(false);
  }), []);
  async function signIn() {
    setError('');
    setSigningIn(true);
    try { await loginWithGoogle(); }
    catch { setError('No se pudo iniciar sesión. Comprueba que este dominio esté autorizado en Firebase.'); }
    finally { setSigningIn(false); }
  }
  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <a href="/" className="text-emerald-300 underline">← Volver al sitio del taller</a>
        <h1 className="text-3xl font-bold">Conexiones del taller</h1>
        <p className="text-neutral-300">Página de configuración separada. No cambia tu sitio público ni envía datos a los proveedores.
          Las credenciales de Notion, Airefs, Adobe y Snowflake permanecen en el servidor.</p>
        <p className="rounded-xl border border-amber-400/40 p-4 text-sm text-amber-200">
          Prueba primero en preview. Crear un conector no significa que tu cuenta ya esté autorizada.
          Estas comprobaciones no leen documentos, crean diseños ni ejecutan consultas.
        </p>
        {error && <p role="alert" className="text-red-300">{error}</p>}
        {checking ? <p>Comprobando sesión…</p> : !user ? (
          <button type="button" disabled={signingIn} onClick={signIn}
            className="rounded-xl bg-emerald-400 px-5 py-3 font-bold text-black disabled:opacity-50">
            {signingIn ? 'Iniciando sesión…' : 'Iniciar sesión con Google'}
          </button>
        ) : <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>Sesión: {user.email || 'Usuario autenticado'}</p>
            <button type="button" onClick={async () => {
              try { await logoutUser(); } catch { setError('No se pudo cerrar la sesión.'); }
            }} className="rounded-xl border border-white/30 px-4 py-2">Cerrar sesión</button>
          </div>
          {providers.map(provider => <ProviderCard key={`${user.uid}-${provider.id}`} provider={provider} user={user} />)}
        </>}
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><Integrations /></StrictMode>);
