import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Served under /ops by the gateway; the betting site owns the root.
  base: '/ops/',
  plugins: [react(), tailwindcss()],
  html: {
    // nginx swaps this placeholder for a per-request nonce and sends the matching CSP header.
    cspNonce: '__CSP_NONCE__',
  },
  server: {
    port: 7110,
    proxy: {
      '/api': 'http://127.0.0.1:7100',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
