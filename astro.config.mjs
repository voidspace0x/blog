// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import scrollableTables from './src/lib/scrollable-tables.mjs';

// https://astro.build/config
// NOTE: repo assumed to be named "blog" (github.com/VoidSpace0x/blog).
// If the repo is renamed to voidspace0x.github.io, drop `base` below.
export default defineConfig({
	site: 'https://voidspace0x.github.io',
	base: '/blog',
	integrations: [
		mdx(),
		sitemap({ filter: (page) => !page.endsWith('/editor/') }),
	],
	markdown: {
		processor: satteri({ hastPlugins: [scrollableTables] }),
		shikiConfig: {
			theme: 'dracula',
		},
	},
});
