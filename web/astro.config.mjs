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
});
