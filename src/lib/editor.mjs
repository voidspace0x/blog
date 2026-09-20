import yaml from 'js-yaml';

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

export function makeImageMarkdown(filename, base = '/blog') {
	if (!filename || /[\\/\u0000-\u001f]/.test(filename))
		throw new Error('그림 파일 이름을 확인해 주세요.');
	const alt = filename
		.replace(/\.[^.]+$/, '')
		.replace(/[-_]+/g, ' ')
		.replace(/[\\[\]]/g, '\\$&');
	return `![${alt}](${base.replace(/\/$/, '')}/images/${encodeURIComponent(filename)})`;
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
	const extras = Object.fromEntries(
		Object.entries(post.extraFrontmatter || {}).filter(
			([key]) => !['title', 'description', 'pubDate', 'category', 'draft'].includes(key),
		),
	);
	const extraYaml = Object.keys(extras).length ? yaml.dump(extras, { lineWidth: -1 }) : '';
	return `---\ntitle: ${JSON.stringify(post.title.trim())}\ndescription: ${JSON.stringify(post.description.trim())}\npubDate: ${post.pubDate}\ncategory: ${post.category}\ndraft: ${Boolean(post.draft)}\n${extraYaml}---\n\n${post.body.trim()}\n`;
}

export function parsePost(markdown) {
	const normalized = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
	const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
	if (!match) throw new Error('파일 맨 위에 YAML frontmatter(---)가 필요합니다.');
	let data;
	try {
		data = yaml.load(match[1]);
	} catch {
		throw new Error('Markdown 파일의 YAML frontmatter를 읽을 수 없습니다.');
	}
	if (!data || typeof data !== 'object' || Array.isArray(data))
		throw new Error('글 메타데이터 형식이 올바르지 않습니다.');
	const date = data.pubDate instanceof Date
		? data.pubDate.toISOString().slice(0, 10)
		: String(data.pubDate ?? '').slice(0, 10);
	const { title, description, category, draft, ...rest } = data;
	delete rest.pubDate;
	return {
		title: typeof title === 'string' ? title : '',
		description: typeof description === 'string' ? description : '',
		pubDate: date,
		category: CATEGORIES.includes(category) ? category : 'chat',
		draft: draft === true,
		body: normalized.slice(match[0].length).trim(),
		extraFrontmatter: rest,
	};
}
