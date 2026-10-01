import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// The accessibility scan (GD-STORY-008): every screen, rendered by the app's own routes in a real
// browser with the real token CSS, checked by axe in both themes. Chromium is enough for axe's
// rules; the golden replays cover the other engines. PW_CHROMIUM points Playwright at an
// already-installed Chromium locally.
const chromium = process.env.PW_CHROMIUM;

export default defineConfig({
  // Zod comes in with the match screen's online session. Found mid-run, Vite re-bundles it and
  // reloads the page under the tests, leaving two copies of React; bundled up front, it can't.
  optimizeDeps: { include: ['@garbage-day/protocol > zod'] },
  test: {
    name: 'app-browser',
    include: ['client/**/*.browser.test.tsx'],
    setupFiles: ['./test/setup.ts'],
    testTimeout: 60_000,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(chromium ? { launchOptions: { executablePath: chromium } } : {}),
      instances: [{ browser: 'chromium' }],
      viewport: { width: 1280, height: 800 },
    },
  },
});
