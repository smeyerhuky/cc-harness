import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// React Compiler through Babel: the stable route (kb/design/stack-and-ci.md). The Cloudflare
// plugin, the Worker and the Durable Objects are added by GD-TICKET-011.
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
});
