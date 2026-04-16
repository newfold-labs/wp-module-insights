import { __ } from '@wordpress/i18n';

const Header = () => (
	<header className="nfd-insights-page__header">
		<h1 className="nfd-mb-2 nfd-text-2xl nfd-font-semibold nfd-tracking-tight nfd-text-gray-900">
			{ __( "Site's Insights", 'wp-module-insights' ) }
		</h1>
		<p className="nfd-m-0 nfd-max-w-2xl nfd-text-sm nfd-leading-relaxed nfd-text-gray-700">
			{ __(
				"A quick overview of your site's performance, accessibility, SEO, and overall health.",
				'wp-module-insights'
			) }
		</p>
	</header>
);

export default Header;
