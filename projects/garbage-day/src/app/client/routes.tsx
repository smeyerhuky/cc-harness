import type { RouteObject } from 'react-router';
import { AppShell, type ScreenHandle } from './AppShell';
import { homeLoader } from './features/home/loader';
import { MatchRouteError, RouteError } from './RouteError';

// The routes (client architecture, "Packages and folders"). Each screen loads on demand, has its
// own error boundary, and names itself for the tab and screen readers (`AppShell`); which part of
// a match to show is the app machine's job, not the URL's.
const screen = (title: string): ScreenHandle => ({ title });

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: AppShell,
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
        handle: screen('Match'),
        lazy: async () => ({ Component: (await import('./features/match')).MatchRoute }),
        ErrorBoundary: MatchRouteError,
      },
      {
        path: 'bot',
        handle: screen('Play a bot'),
        lazy: async () => ({ Component: (await import('./features/bot')).BotSetupScreen }),
        ErrorBoundary: RouteError,
      },
      {
        path: 'new',
        handle: screen('Create a game'),
        lazy: async () => ({
          Component: (await import('./features/private-game')).PrivateGameScreen,
        }),
        ErrorBoundary: RouteError,
      },
      {
        path: 'g/:code',
        handle: screen('Private game'),
        lazy: async () => {
          const m = await import('./features/private-game');
          return { Component: m.PrivateGameScreen, loader: m.gameCodeLoader };
        },
        ErrorBoundary: RouteError,
      },
      {
        path: 'settings',
        handle: screen('Settings'),
        lazy: async () => ({ Component: (await import('./features/settings')).SettingsScreen }),
        ErrorBoundary: RouteError,
      },
      {
        // The ui commons' gallery, a visual check (GD-TICKET-023).
        path: 'gallery',
        handle: screen('Gallery'),
        lazy: async () => ({ Component: (await import('@garbage-day/ui/gallery')).Gallery }),
        ErrorBoundary: RouteError,
      },
      {
        path: '*',
        handle: screen('Nothing here'),
        loader: () => {
          throw new Response('Not found', { status: 404, statusText: 'That page does not exist' });
        },
        ErrorBoundary: RouteError,
      },
    ],
  },
];
