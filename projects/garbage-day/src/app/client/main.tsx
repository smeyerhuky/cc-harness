import '@garbage-day/ui/fonts.css';
import '@garbage-day/ui/tokens.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { App } from './App';
import { routes } from './routes';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App router={createBrowserRouter(routes)} />
  </StrictMode>,
);
