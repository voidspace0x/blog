import type { CollectionEntry } from 'astro:content';

export function readingMinutes(post: CollectionEntry<'blog'>): number | null {
	const plain = (post.body || '')
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/[\[\]#*_`>|]/g, ' ');
	const hangul = (plain.match(/[가-힣]/g) || []).length;
	const words = (plain.replace(/[가-힣]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
	const minutes = Math.ceil(hangul / 450 + words / 220);
	return minutes >= 3 ? minutes : null;
}
