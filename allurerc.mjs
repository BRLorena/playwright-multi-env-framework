/**
 * Allure 3 report config (npx allure generate allure-results).
 *
 * Each Playwright project is an Allure environment, so the report has an
 * environment switcher and per-env results. allure-playwright stores the
 * project name in the parentSuite label. Keep the list in sync with
 * config/environments.ts.
 *
 * history.jsonl holds one line per run for the trend charts. CI downloads
 * the previous copy from GitHub Pages before generating and publishes the
 * updated file next to the report, so trends carry over between runs.
 */
const ENV_NAMES = ["stable", "release", "int"];

const projectIs =
  (name) =>
  ({ labels }) =>
    labels.some(
      (label) => label.name === "parentSuite" && label.value === name,
    );

export default {
  name: "Playwright Multi-Environment Tests",
  output: "./allure-report",
  historyPath: "./history.jsonl",
  historyLimit: 30,
  environments: Object.fromEntries(
    ENV_NAMES.map((name) => [name, { matcher: projectIs(name) }]),
  ),
  plugins: {
    awesome: {
      options: {
        groupBy: ["suite", "subSuite"],
      },
    },
  },
};
