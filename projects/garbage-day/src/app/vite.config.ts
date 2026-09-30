import { cloudflare } from '@cloudflare/vite-plugin';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// React Compiler through Babel: the stable route (kb/design/stack-and-ci.md). The Cloudflare
// plugin runs the Worker and both Durable Objects in workerd during `vite dev` and builds them.
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), cloudflare()],
});
