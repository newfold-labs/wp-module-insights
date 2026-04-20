/**
 * Lighthouse Widget entry.
 *
 * Authored in wp-module-insights so host plugins (Bluehost, HostGator, etc.) can surface
 * the Lighthouse summary without carrying any React/UI code.
 *
 * This bundle mounts in two places:
 *
 * 1. WordPress dashboard widget — into `#nfd_lighthouse_report_widget_root` when present.
 * 2. Host plugin page — via the plugin's `window.NFDPortalRegistry` under the
 *    `lighthouse-report` portal name. If the registry is unavailable the portal mount is
 *    silently skipped, so this bundle is safe to enqueue on pages where only one of the
 *    two mount points exists.
 */

import './index.css';

import domReady from '@wordpress/dom-ready';
import { createRoot, createPortal, useEffect, useState } from '@wordpress/element';
import { Root } from '@newfold/ui-component-library';
import LighthouseReportEmbed from '../insights-page/components/LighthouseReport/LighthouseReportEmbed';

const DASHBOARD_WIDGET_ROOT_ID = 'nfd_lighthouse_report_widget_root';
const PORTAL_HOST_ROOT_ID = 'nfd-lighthouse-report-portal-host';
const PORTAL_NAME = 'lighthouse-report';

/**
 * React tree for the wp-admin dashboard widget.
 *
 * `.nfd-widget-lighthouse` must wrap everything the bundle renders — the compiled CSS
 * for this bundle is scoped to that class (see webpack.config.js), so descendants only
 * pick up our styles when they sit inside this subtree.
 */
const DashboardWidgetApp = () => (
	<Root>
		<div className="nfd-widget-lighthouse">
			<LighthouseReportEmbed isDashboardWidget={ true } />
		</div>
	</Root>
);

/**
 * Subscribes to `NFDPortalRegistry` and renders the Lighthouse embed into the registered
 * container. When no registry or portal is present the component renders nothing.
 */
const PortalApp = () => {
	const [ container, setContainer ] = useState( null );

	useEffect( () => {
		const registry =
			typeof window !== 'undefined' ? window.NFDPortalRegistry : null;
		if ( ! registry ) {
			return undefined;
		}

		const update = ( element ) => setContainer( element || null );
		const clear = () => setContainer( null );

		registry.onReady( PORTAL_NAME, update );
		registry.onRemoved( PORTAL_NAME, clear );

		const current = registry.getElement( PORTAL_NAME );
		if ( current ) {
			update( current );
		}
	}, [] );

	if ( ! container ) {
		return null;
	}

	return createPortal(
		<Root>
			<div className="nfd-widget-lighthouse">
				<LighthouseReportEmbed isDashboardWidget={ false } />
			</div>
		</Root>,
		container
	);
};

/**
 * Mounts both the dashboard widget (if its root exists) and a headless portal host that
 * forwards into the plugin's `NFDPortalRegistry` (if available).
 */
const mount = () => {
	if ( typeof createRoot !== 'function' ) {
		return;
	}

	const widgetRoot = document.getElementById( DASHBOARD_WIDGET_ROOT_ID );
	if ( widgetRoot && ! widgetRoot.dataset.nfdLighthouseMounted ) {
		widgetRoot.dataset.nfdLighthouseMounted = '1';
		createRoot( widgetRoot ).render( <DashboardWidgetApp /> );
	}

	// The portal host is a zero-layout node owned by this bundle — it subscribes to the
	// registry and portals into the container the host plugin registers for us.
	if (
		typeof window !== 'undefined' &&
		window.NFDPortalRegistry &&
		! document.getElementById( PORTAL_HOST_ROOT_ID )
	) {
		const host = document.createElement( 'div' );
		host.id = PORTAL_HOST_ROOT_ID;
		host.style.display = 'none';
		document.body.appendChild( host );
		createRoot( host ).render( <PortalApp /> );
	}
};

domReady( mount );
