import './index.css';

import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';
import { getQueryArgs } from '@wordpress/url';
import { Root } from '@newfold/ui-component-library';
import InsightsPage from './components/InsightsPage';
import { InsightsProvider } from './context/InsightsContext';
import ScanResultDetailsPage from './components/ScanResultDetailsPage';

const WP_INSIGHTS_PAGE_ROOT_ELEMENT = 'nfd-insights-app';

const App = () => {
	const queryArgs = getQueryArgs( window.location.search );
	const scanResultId = queryArgs[ 'scan-result' ];

	return (
		<Root>
			<InsightsProvider>
				{ scanResultId ? <ScanResultDetailsPage scanId={ scanResultId }/> : <InsightsPage/> }
			</InsightsProvider>
		</Root>
	);
};

const InsightsPageRender = () => {
	const DOM_ELEMENT = document.getElementById(
		WP_INSIGHTS_PAGE_ROOT_ELEMENT
	);
	if ( null !== DOM_ELEMENT ) {
		if ( 'undefined' !== typeof createRoot ) {
			createRoot( DOM_ELEMENT ).render( <App/> );
		}
	}
};

domReady( InsightsPageRender );
