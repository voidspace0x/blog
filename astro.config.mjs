// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
// NOTE: repo assumed to be named "blog" (github.com/VoidSpace0x/blog).
// If the repo is renamed to voidspace0x.github.io, drop `base` below.
export default defineConfig({
	site: 'https://voidspace0x.github.io',
	base: '/blog',
	integrations: [mdx(), sitemap()],
	markdown: {
		shikiConfig: {
			theme: 'dracula',
		},
	},
});
