<a href="https://newfold.com/" target="_blank">
    <img src="https://newfold.com/content/experience-fragments/newfold/site-header/master/_jcr_content/root/header/logo.coreimg.svg/1621395071423/newfold-digital.svg" alt="Newfold Logo" title="Newfold Digital" align="right" height="42" />
</a>

# wp-module-insights

A Newfold module that provides website performance insights, including Google Lighthouse reports and historical tracking, directly within the WordPress dashboard.

## Module Responsibilities

*   **Insights Dashboard**: Adds a "Tools > Insights" page to display key performance metrics.
*   **Lighthouse Reports**: Visualizes scores for Performance, Accessibility, Best Practices, and SEO.
*   **Historical Data**: Tracks performance scores over time with interactive charts.
*   **On-Demand Scanning**: Allows users to manually trigger new performance checks via Hiive API.
*   **Recurring Scans**: Option to enable/disable automated recurring performance scans.
*   **Diagnostics**: Provides detailed diagnostic information and improvement suggestions based on Lighthouse audits.

## Critical Paths

*   **Dashboard View**: User visits "Tools > Insights" to view the latest report.
*   **Run Scan**: User clicks "Run Test" to trigger a realtime performance scan.
*   **Recurring Scans**: User toggles "Enable recurring scans" to automate checks.
*   **Detailed Report**: User clicks "View Detailed Report" to see the full analysis on Hiive.

## Installation

### 1. Add the Newfold Satis to your `composer.json`.

 ```bash
 composer config repositories.newfold composer https://newfold-labs.github.io/satis
 ```

### 2. Require the `newfold-labs/wp-module-insights` package.

 ```bash
 composer require newfold-labs/wp-module-insights
 ```

### 3. Install the `@newfold/wp-module-insights` npm package (if needed for consumption).

 ```bash
 npm install @newfold/wp-module-insights
 ```

## Usage

This module integrates automatically when part of the Newfold module ecosystem.

### PHP
The module bootstraps via `bootstrap.php` and initializes the `Insights` container, registering the necessary Admin hooks and REST API routes (`newfold-insights/v1`).

### React
The frontend application is built into `build/` and is enqueued on the Insights admin page.

```jsx
import { InsightsProvider } from './context/InsightsContext';
import InsightsPage from './components/InsightsPage';

// Example usage structure
<InsightsProvider>
    <InsightsPage />
</InsightsProvider>
```

[More on Newfold WordPress Modules](https://github.com/newfold-labs/wp-module-loader)
