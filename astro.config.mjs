// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://truefinancetools.com',
  integrations: [
    sitemap({
      filter: (page) => !page.match(/\/(403|404|500|503)\/?$/),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
