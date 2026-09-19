// Wrap Markdown and MDX tables during the build; no client JavaScript needed.
export default {
	name: 'scrollable-tables',
	element: {
		filter: ['table'],
		visit(node, context) {
			context.wrapNode(node, {
				type: 'element',
				tagName: 'div',
				properties: {
					className: ['table-scroll'],
					tabIndex: 0,
					role: 'region',
					ariaLabel: '표 — 좌우로 스크롤할 수 있습니다',
				},
				children: [],
			});
		},
	},
};
