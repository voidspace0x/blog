import assert from 'node:assert/strict';
import test from 'node:test';
import {
	createPost,
	encodeUtf8Base64,
	makeFilename,
	makeSlug,
	serializePost,
	validatePost,
} from './editor.mjs';

const sample = {
	title: '한글 "제목"',
	description: '짧은 요약',
	pubDate: '2026-09-19',
	category: 'dev',
	draft: true,
	body: '# 본문\n\n테스트입니다.',
};

test('Korean Markdown and quoted frontmatter survive UTF-8 encoding', () => {
	const markdown = serializePost(sample);
	assert.match(markdown, /title: "한글 \\"제목\\""/);
	assert.match(markdown, /draft: true/);
	assert.equal(
		Buffer.from(encodeUtf8Base64(markdown), 'base64').toString('utf8'),
		markdown,
	);
});

test('reject invalid paths and missing content', () => {
	assert.equal(makeSlug('Hello, Astro 7!'), 'hello-astro-7');
	assert.equal(makeSlug('한글 "제목"'), '한글-제목');
	assert.equal(
		makeFilename('한글 "제목"', new Date('2026-09-18T15:01:00Z')),
		'2026-09-19-한글-제목.md',
	);
	assert.match(validatePost({ ...sample, title: '🎉' }), /파일 이름/);
	assert.match(validatePost({ ...sample, body: '  ' }), /본문/);
	assert.match(validatePost({ ...sample, pubDate: '2026-02-30' }), /게시일/);
});

test('publishing creates a new file in the intended repository and branch', async () => {
	let request;
	const result = await createPost({
		post: sample,
		token: 'test-token',
		now: new Date('2026-09-18T15:01:00Z'),
		fetcher: async (url, options) => {
			request = { url, options };
			return {
				status: 201,
				json: async () => ({
					content: {
						html_url:
							'https://github.com/voidspace0x/blog/blob/main/src/content/blog/2026-09-19-%ED%95%9C%EA%B8%80-%EC%A0%9C%EB%AA%A9.md',
					},
					commit: { sha: 'abc' },
				}),
			};
		},
	});
	assert.equal(
		request.url,
		`https://api.github.com/repos/voidspace0x/blog/contents/src/content/blog/${encodeURIComponent('2026-09-19-한글-제목.md')}`,
	);
	assert.equal(JSON.parse(request.options.body).branch, 'main');
	assert.equal(request.options.headers.Authorization, 'Bearer test-token');
	assert.equal(result.sha, 'abc');
});

test('conflicts cannot overwrite an existing article', async () => {
	await assert.rejects(
		createPost({
			post: sample,
			token: 'test-token',
			fetcher: async () => ({ status: 422 }),
		}),
		/이미 있거나/,
	);
});
