import assert from 'node:assert/strict';
import test from 'node:test';
import {
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

test('Korean Markdown and quoted frontmatter serialize correctly', () => {
	const markdown = serializePost(sample);
	assert.match(markdown, /title: "한글 \\"제목\\""/);
	assert.match(markdown, /draft: true/);
});

test('reject invalid paths and missing content', () => {
	assert.equal(makeSlug('Hello, Astro 7!'), 'hello-astro-7');
	assert.equal(makeSlug('한글 "제목"'), '한글-제목');
	assert.equal(
		makeFilename('한글 "제목"', new Date('2026-09-18T15:01:00Z')),
		'2026-09-19-0001-한글-제목.md',
	);
	assert.match(validatePost({ ...sample, title: '🎉' }), /파일 이름/);
	assert.match(validatePost({ ...sample, body: '  ' }), /본문/);
	assert.match(validatePost({ ...sample, pubDate: '2026-02-30' }), /게시일/);
});
