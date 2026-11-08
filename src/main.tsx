import {createRoot} from 'react-dom/client';
import { lazy, Suspense } from 'react';
import App from './App.tsx';
import './index.css';

const AdminAccess = lazy(() => import('./components/AdminAccess'));
const isAdministration = window.location.pathname.replace(/\/$/, '') === '/administracion';

createRoot(document.getElementById('root')!).render(
  isAdministration
    ? <Suspense fallback={<p>Verificando acceso…</p>}><AdminAccess /></Suspense>
    : <App />
);
