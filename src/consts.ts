// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'VoidSpace0x';
export const SITE_DESCRIPTION = '잡담, 개발, 주식 — 공허를 떠도는 기록들.';

export const CATEGORY_LABELS = {
	chat: '잡담',
	dev: '개발',
	stock: '주식',
} as const;

export type Category = keyof typeof CATEGORY_LABELS;
