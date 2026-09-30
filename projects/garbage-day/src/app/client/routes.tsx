import type { RouteObject } from 'react-router';
import { homeLoader } from './features/home/loader';
import { MatchRouteError, RouteError } from './RouteError';

// The routes (client architecture, "Packages and folders"). Each screen loads on demand and has
// its own error boundary; which part of a match to show is the app machine's job, not the URL's.
export const routes: RouteObject[] = [
  {
    path: '/',
    ErrorBoundary: RouteError,
    children: [
      {
        index: true,
        loader: homeLoader,
        lazy: async () => ({ Component: (await import('./features/home')).HomeScreen }),
        ErrorBoundary: RouteError,
      },
      {
        path: 'play',
        lazy: async () => ({ Component: (await import('./features/match')).MatchRoute }),
        ErrorBoundary: MatchRouteError,
      },
      {
        path: 'bot',
        lazy: async () => ({ Component: (await import('./features/bot')).BotSetupScreen }),
        ErrorBoundary: RouteError,
      },
      {
        path: 'new',
        lazy: async () => ({
          Component: (await import('./features/private-game')).PrivateGameScreen,
        }),
        ErrorBoundary: RouteError,
      },
      {
        path: 'g/:code',
        lazy: async () => {
          const m = await import('./features/private-game');
          return { Component: m.PrivateGameScreen, loader: m.gameCodeLoader };
        },
        ErrorBoundary: RouteError,
      },
      {
        path: 'settings',
        lazy: async () => ({ Component: (await import('./features/settings')).SettingsScreen }),
        ErrorBoundary: RouteError,
      },
      {
        // The ui commons' gallery, a visual check (GD-TICKET-023).
        path: 'gallery',
        lazy: async () => ({ Component: (await import('@garbage-day/ui/gallery')).Gallery }),
        ErrorBoundary: RouteError,
      },
      {
        path: '*',
        loader: () => {
          throw new Response('Not found', { status: 404, statusText: 'That page does not exist' });
        },
        ErrorBoundary: RouteError,
      },
    ],
  },
];
