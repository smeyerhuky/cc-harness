import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// The golden replays in real browsers (GD-TICKET-019): the determinism contract must hold on
// every JavaScript engine a player uses, not only Node's V8. CI runs all three. Locally,
// GD_BROWSERS picks browsers (for example `GD_BROWSERS=chromium`) and PW_CHROMIUM points
// Playwright at an already-installed Chromium.
type Browser = 'chromium' | 'firefox' | 'webkit';
const browsers = (process.env.GD_BROWSERS ?? 'chromium,firefox,webkit').split(',') as Browser[];
const chromium = process.env.PW_CHROMIUM;

export default defineConfig({
  test: {
    name: 'engine-browser',
    include: ['src/golden.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(chromium ? { launchOptions: { executablePath: chromium } } : {}),
      instances: browsers.map((browser) => ({ browser })),
    },
  },
});
