import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://tianhaoz95.github.io',
  base: '/mdwow/',
  output: 'static',
  build: {
    assets: '_assets',
  },
});
