const path = require( 'path' );

/**
 * Shared postcss pipeline for both webpack entries.
 *
 * `postcss-prefix-selector` is included here (not only in the widget's webpack rule)
 * because `@wordpress/scripts`' default `/.css$/` rule also applies this project's
 * `postcss.config.js` — anything we add inline on our own rule would be duplicated /
 * shadowed. We therefore keep the pipeline shared and limit the prefixing plugin to
 * the widget bundle through its `includeFiles` option.
 *
 * The widget's compiled CSS is mounted into host pages (wp-admin dashboard, Bluehost
 * Home). Without this containment, Tailwind-generated rules like `.nfd-container`
 * media-query max-widths override Bluehost's `.nfd-max-w-full` utility on `<Container>`
 * elements and narrow the host page layout.
 */
module.exports = {
	plugins: [
		require( 'postcss-import' ),
		require( 'tailwindcss/nesting' ),
		require( 'tailwindcss' ),
		require( 'autoprefixer' ),
		require( 'postcss-prefix-selector' )( {
			prefix: '.nfd-widget-lighthouse',
			includeFiles: [
				path.resolve( __dirname, 'src/lighthouse-widget' ),
			],
			transform( prefix, selector, prefixedSelector ) {
				/*
				 * Leave Tailwind's custom-property declarations on globally-scoped
				 * selectors untouched — prefixing them would stop `--tw-*` defaults
				 * from reaching our descendants.
				 */
				if (
					selector === '*' ||
					selector === '::before' ||
					selector === '::after' ||
					selector === '::backdrop' ||
					selector === ':root' ||
					selector === 'html' ||
					selector === 'body' ||
					selector.indexOf( '.nfd-widget-lighthouse' ) !== -1
				) {
					return selector;
				}
				return prefixedSelector;
			},
		} ),
	],
};
