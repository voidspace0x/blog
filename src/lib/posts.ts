import { getCollection, type CollectionEntry } from 'astro:content';

export const sortPosts = (
	a: CollectionEntry<'blog'>,
	b: CollectionEntry<'blog'>,
) =>
	b.data.pubDate.valueOf() - a.data.pubDate.valueOf() ||
	a.id.localeCompare(b.id, 'en');

export async function getPosts() {
	return (
		await getCollection(
			'blog',
			({ data }) => !import.meta.env.PROD || !data.draft,
		)
	).sort(sortPosts);
}
