export const CATEGORIES = ['chat', 'dev', 'stock'];
export const REPOSITORY = 'voidspace0x/blog';

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
		})
			.formatToParts(date)
			.map(({ type, value }) => [type, value]),
	);
	return `${parts.year}-${parts.month}-${parts.day}-${slug}.md`;
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

export function encodeUtf8Base64(value) {
	const bytes = new TextEncoder().encode(value);
	let binary = '';
	for (let index = 0; index < bytes.length; index += 8192) {
		binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
	}
	return btoa(binary);
}

export async function createPost({
	post,
	token,
	fetcher = fetch,
	now = new Date(),
}) {
	const content = serializePost(post);
	const filename = makeFilename(post.title, now);
	const path = `src/content/blog/${encodeURIComponent(filename)}`;
	const response = await fetcher(
		`https://api.github.com/repos/${REPOSITORY}/contents/${path}`,
		{
			method: 'PUT',
			headers: {
				Accept: 'application/vnd.github+json',
				Authorization: `Bearer ${token.trim()}`,
				'Content-Type': 'application/json',
				'X-GitHub-Api-Version': '2022-11-28',
			},
			body: JSON.stringify({
				message: `${post.draft ? 'Draft' : 'Publish'}: ${post.title.trim()}`,
				content: encodeUtf8Base64(content),
				branch: 'main',
			}),
		},
	);
	if (response.status !== 201) {
		if (response.status === 401 || response.status === 403)
			throw new Error(
				'GitHub 인증에 실패했습니다. 토큰의 만료일과 저장소 Contents 읽기·쓰기 권한을 확인해 주세요.',
			);
		if (response.status === 422 || response.status === 409)
			throw new Error(
				'같은 날짜와 제목의 글이 이미 있거나 저장소가 변경되었습니다. 제목을 확인해 주세요.',
			);
		throw new Error(
			`GitHub에 저장하지 못했습니다. 상태 코드: ${response.status}`,
		);
	}
	const result = await response.json();
	return { url: result.content.html_url, sha: result.commit.sha };
}
