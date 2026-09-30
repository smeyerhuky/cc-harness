import '@garbage-day/ui/fonts.css';
import '@garbage-day/ui/tokens.css';
import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { loadServerStatus } from './health';

// The ui commons' visual check (GD-TICKET-023), loaded only on its own path until the router
// (GD-TICKET-014) gives it a route.
const Gallery = lazy(() => import('@garbage-day/ui/gallery').then((m) => ({ default: m.Gallery })));

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    {window.location.pathname === '/gallery' ? (
      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
    ) : (
      <App status={loadServerStatus()} />
    )}
  </StrictMode>,
);
