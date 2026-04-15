---
name: wp-module-insights
title: Dependencies
description: Composer and npm dependencies.
updated: 2025-03-18
---

# Dependencies

**Runtime:** newfold-labs/wp-module-data, newfold-labs/wp-module-loader. **Dev:** newfold-labs/wp-php-standards, johnpbloch/wordpress, lucatume/wp-browser, phpunit/phpcov.

**npm (Insights page CSS):** `postcss-import` inlines `@import "@newfold/ui-component-library"` before Tailwind so `@newfold/ui-component-library` Button styles (e.g. `.nfd-button--primary`) are emitted in `build/insights-page/insights-page.css`, matching the Bluehost plugin pipeline.
