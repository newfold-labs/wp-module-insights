---
name: wp-module-insights
title: Dependencies
description: Composer and npm dependencies.
updated: 2026-08-13
---

# Dependencies

**Runtime:** newfold-labs/wp-module-data, newfold-labs/wp-module-loader. **Dev:** newfold-labs/wp-php-standards, johnpbloch/wordpress, lucatume/wp-browser, phpunit/phpcov.

**Node.js:** Use **22.x** (see `.nvmrc`). `@newfold/wp-module-runtime` requires Node `>=22.11.0`; `package.json` `engines.node` matches that.

**npm (Insights page CSS):** `postcss-import` inlines `@import "@newfold/ui-component-library"` before Tailwind so `@newfold/ui-component-library` Button styles (e.g. `.nfd-button--primary`) are emitted in `build/insights-page/insights-page.css`, matching the Bluehost plugin pipeline.

**npm (Insights page JS):** Insights dropdowns (including time range / “All time results”) use `Select` from `@newfold/ui-component-library`, with scoped `nfd-insights-neutral-select` styles in `src/insights-page/index.css`. Non-qualifying ranges are styled (grey, italic, no hover background) via a label wrapper class and `:has()`; `onChange` ignores those values, since the library `Select` has no per-option `disabled` prop.

## npm overrides

`@wordpress/scripts` still pins vulnerable ranges for a few transitive packages, so these are forced to patched versions in the `overrides` block of `package.json`:

| Package | Pinned to | Why |
|---|---|---|
| `adm-zip` | `^0.6.0` | Crafted ZIP triggers a 4GB allocation. wp-env/wp-scripts still require `^0.5.9`. |
| `markdown-it` | `^14.2.0` | Pulled in by `markdownlint-cli` at a vulnerable 12.x. |
| `linkify-it` | `^5.0.2` | Paired with the `markdown-it` bump. |
| `serialize-javascript` | `^7.0.5` | Requires Node >= 20, which matches the repo Node baseline. |
| `uuid` | `^11.1.1` | Vulnerable range still pinned upstream. |
| `markdownlint-cli` > `minimatch` | `^3.1.5` | Scoped, only `markdownlint-cli` pulls the vulnerable 3.0.x. |

Drop each override once the upstream package stops pinning the vulnerable range.

**Known gap: `extract-zip`.** There is no patched release, 2.0.1 is the latest ever published. It arrives through `@wordpress/scripts` -> `@wordpress/e2e-test-utils-playwright` -> `lighthouse` -> `puppeteer-core` -> `@puppeteer/browsers`, so it is only reachable from the dev e2e toolchain and never ships. `@puppeteer/browsers` 3.x drops it, but that is a major bump away from what `puppeteer-core` pins. Revisit when the toolchain moves.
