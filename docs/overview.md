---
name: wp-module-insights
title: Overview
description: What the module does and who maintains it.
updated: 2026-04-20
---

# Overview

**wp-module-insights** handles integration of the Insights page for Newfold brand plugins
and surfaces the Lighthouse summary on both the wp-admin dashboard (as a meta box) and on
host plugin pages (via `NFDPortalRegistry`). It registers with the Newfold Module Loader
and depends on wp-module-data and wp-module-loader. Maintained by Newfold Labs. Distributed
via Newfold Satis.

See [integration.md](integration.md) for how host plugins integrate the Lighthouse widget.
