import './index.css';

import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';
import { Root } from '@newfold/ui-component-library';
import InsightsPage from './components/InsightsPage';

const WP_INSIGHTS_PAGE_ROOT_ELEMENT = 'nfd-insights-app';

const App = () => <Root>
    <InsightsPage/>
</Root>

const InsightsPageRender = () => {
    const DOM_ELEMENT = document.getElementById(
        WP_INSIGHTS_PAGE_ROOT_ELEMENT
    );
    if (null !== DOM_ELEMENT) {
        if ('undefined' !== typeof createRoot) {
            createRoot(DOM_ELEMENT).render(<App />);
        }
    }
};

domReady(InsightsPageRender);
