import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://agiletactix.ai',
  integrations: [
    tailwind(),
    mdx(),
    sitemap({
      filter: (page) => !page.includes('playbook-thank-you')
    })
  ],
  output: 'static',
  adapter: cloudflare(),
  build: {
    assets: 'assets'
  }
});
