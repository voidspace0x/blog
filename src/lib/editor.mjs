export const CATEGORIES = ['chat', 'dev', 'stock'];

export function makeSlug(value) {
	return value
		.toLowerCase()
		.normalize('NFC')
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/g, '');
}

export function makeFilename(title, date = new Date()) {
	const slug = Array.from(makeSlug(title))
		.slice(0, 80)
		.join('')
		.replace(/-+$/, '');
	if (!slug)
		throw new Error('파일 이름에 사용할 글자나 숫자가 제목에 필요합니다.');
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat('en-US', {
			timeZone: 'Asia/Seoul',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23',
		})
			.formatToParts(date)
			.map(({ type, value }) => [type, value]),
	);
	return `${parts.year}-${parts.month}-${parts.day}-${parts.hour}${parts.minute}-${slug}.md`;
}

export function validatePost(post) {
	if (!post.title.trim()) return '제목을 입력해 주세요.';
	if (!post.description.trim()) return '요약을 입력해 주세요.';
	if (!makeSlug(post.title))
		return '파일 이름에 사용할 글자나 숫자가 제목에 필요합니다.';
	const date = new Date(`${post.pubDate}T00:00:00Z`);
	if (
		!/^\d{4}-\d{2}-\d{2}$/.test(post.pubDate) ||
		Number.isNaN(date.valueOf()) ||
		date.toISOString().slice(0, 10) !== post.pubDate
	)
		return '게시일을 확인해 주세요.';
	if (!CATEGORIES.includes(post.category)) return '카테고리를 선택해 주세요.';
	if (!post.body.trim()) return '본문을 입력해 주세요.';
	return null;
}

export function serializePost(post) {
	const error = validatePost(post);
	if (error) throw new Error(error);
	// JSON strings are valid quoted YAML scalars. This also escapes quotes and newlines.
	return `---\ntitle: ${JSON.stringify(post.title.trim())}\ndescription: ${JSON.stringify(post.description.trim())}\npubDate: ${post.pubDate}\ncategory: ${post.category}\ndraft: ${Boolean(post.draft)}\n---\n\n${post.body.trim()}\n`;
}
