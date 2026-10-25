/**
 * Allure 3 report config (npx allure generate allure-results).
 *
 * history.jsonl holds one line per run for the trend charts. CI downloads
 * the previous copy from GitHub Pages before generating and publishes the
 * updated file next to the report, so trends carry over between runs.
 */
export default {
  name: "Playwright Multi-Environment Tests",
  output: "./allure-report",
  historyPath: "./history.jsonl",
  historyLimit: 30,
};
