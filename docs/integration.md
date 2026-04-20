---
name: wp-module-insights
title: Integration
description: How the module registers and integrates.
updated: 2026-04-20
---

# Integration

The module registers with the Newfold Module Loader via `bootstrap.php`. The host plugin
typically registers an insights service. See [dependencies.md](dependencies.md).

## Surfaces

The module ships two front-end bundles:

| Bundle | Built to | Mounted on |
|--------|----------|-----------|
| `insights-page` | `build/insights-page/bundle.js` | Tools → Site Insights (`tools.php?page=nfd-insights`). |
| `lighthouse-widget` | `build/lighthouse-widget/bundle.js` | wp-admin dashboard widget + any host plugin page that registers a `lighthouse-report` portal. |

Both bundles are enqueued by `NewfoldLabs\WP\Module\Insights\Admin\Admin` (see
`includes/Admin/Admin.php`).

## Lighthouse widget (dashboard + host plugin pages)

The Lighthouse summary that used to live in `wp-plugin-bluehost` is now provided by this
module. The `lighthouse-widget` bundle self-mounts in two places, so host plugins do not
need to carry any of the Lighthouse React/CSS code:

1. **wp-admin dashboard widget** — `\NewfoldLabs\WP\Module\Insights\Admin\LighthouseWidget`
   registers a meta box with id `nfd_lighthouse_report_widget`. The bundle React-mounts
   into the `#nfd_lighthouse_report_widget_root` div inside the view.
2. **Host plugin home page (opt-in)** — if the host plugin exposes a `NFDPortalRegistry`
   (see wp-plugin-bluehost's `src/portalRegistry/index.js`) and registers a portal named
   `lighthouse-report`, the bundle creates a React portal into that container.

Host-side integration is a single markup + registry pair:

```jsx
useEffect( () => {
    const el = document.getElementById( 'lighthouse-report-portal' );
    if ( el && window.NFDPortalRegistry ) {
        window.NFDPortalRegistry.registerPortal( 'lighthouse-report', el );
    }
    return () => window.NFDPortalRegistry?.unregisterPortal( 'lighthouse-report' );
}, [] );

// …later in the page
<div id="lighthouse-report-portal" />
```

The module decides whether to enqueue the bundle using `container()->plugin()->id`: it
loads on the dashboard (`index.php`) and on any admin screen whose id contains the host
plugin id. Plugins with non-standard screen ids can override the decision via the
`nfd_insights_enqueue_lighthouse_widget` filter.

## Localized data

Both bundles read the same payload on `window.NFD_INSIGHTS_HOME` (for the widget) and
`window.NFD_INSIGHTS_DATA` (for the full page). Keys:

| Key | Source |
|-----|--------|
| `isRunningScan` | `InsightsRepository::is_scan_locked()` |
| `isRecurringScansEnabled` | `InsightsRepository::get_recurring_scans_status()` |
| `canScanPerformance` | Module loader container `capabilities` service |
| `adminUrl` | `admin_url()` |
