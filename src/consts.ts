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

export const CATEGORY_DESCRIPTIONS = {
	chat: '그때그때 떠오른 생각과 일상의 작은 기록.',
	dev: '만들면서 배운 것, 막혔다가 풀린 것.',
	stock: '보고 있는 종목과 시장에 대한 생각, 그리고 복기.',
} as const;
