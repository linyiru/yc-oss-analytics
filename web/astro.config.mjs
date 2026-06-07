// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// US English is the default (no path prefix). Other locales live under /<locale>/.
export default defineConfig({
  site: 'https://yc-oss-analytics.pages.dev',
  integrations: [react()],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-Hant', 'zh-Hans', 'ja', 'ko', 'pt'],
    routing: { prefixDefaultLocale: false },
  },
  // "Playbook" was renamed to "Signals"; keep the old URLs alive.
  redirects: {
    '/playbook': '/signals',
    '/zh-Hant/playbook': '/zh-Hant/signals',
    '/zh-Hans/playbook': '/zh-Hans/signals',
    '/ja/playbook': '/ja/signals',
    '/ko/playbook': '/ko/signals',
    '/pt/playbook': '/pt/signals',
  },
});
