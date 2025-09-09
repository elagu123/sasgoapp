// FIX: Changed 'test' to a default import and 'expect' to a named import to resolve module resolution errors.
import test, { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dashboard Accessibility', () => {
  test('Dashboard should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/#/app/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Dashboard has no critical a11y violations', async ({ page }) => {
    await page.goto('/#/app/dashboard');
    const results = await new AxeBuilder({ page }).analyze();
    const criticalViolations = results.violations.filter(v => v.impact === 'critical');
    expect(criticalViolations).toEqual([]);
  });
});