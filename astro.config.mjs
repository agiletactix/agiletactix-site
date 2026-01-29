import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://agiletactix.ai',
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => !page.includes('playbook-thank-you')
    })
  ],
  output: 'static',
  build: {
    assets: 'assets'
  }
});
