import { __ } from '@wordpress/i18n';

const App = () =>
	<div className="nfd-insights-app-container p-8">
		<h1 className="text-2xl font-bold mb-4">{ __( 'Site\'s Insights', 'wp-module-insights' ) }</h1>
		<p>{ __( 'A quick overview of your site\'s performance, accessibility, SEO, and overall health.', 'wp-module-insights' ) }</p>
	</div>;

export default App;
