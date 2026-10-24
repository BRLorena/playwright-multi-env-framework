import AxeBuilder from "@axe-core/playwright";
import { Page } from "@playwright/test";

/** WCAG 2.1 level A and AA rules (axe-core tags) */
const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/**
 * Runs axe-core on the current page and returns one readable line per
 * failing element ("rule: selector"), so a failed `toEqual([])` shows
 * exactly what to fix.
 */
export async function a11yViolations(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_AA)
    .analyze();
  return violations.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id}: ${node.target.join(" ")}`),
  );
}
