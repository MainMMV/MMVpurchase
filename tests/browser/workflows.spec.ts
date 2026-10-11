import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function fresh(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start fresh', exact: true }).first().click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
}
async function navigate(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name, exact: true })
    .click();
}
async function create(page: Page, kind: string, name: string, amount: string) {
  await page.locator('.add-menu summary').click();
  await page.getByRole('button', { name: `New ${kind}`, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill(name);
  await dialog.getByLabel(/Unit price|Target amount|Amount \(optional\)/).fill(amount);
  return dialog;
}

test('purchase creation, persistence, completion, trash, restore and undo', async ({ page }) => {
  await fresh(page);
  await navigate(page, 'Purchases');
  const form = await create(page, 'purchase', 'Test headphones', '200000');
  await form.getByLabel('Quantity').fill('2');
  await form.getByLabel('Vendor').fill('Local store');
  await form.getByRole('button', { name: 'Create purchase', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('400,000');
  await page.reload();
  await expect(page.getByRole('table')).toContainText('Test headphones');
  await page.getByRole('button', { name: 'Open Test headphones' }).click();
  await page.getByRole('button', { name: 'Mark purchased', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Purchased');
  await page.getByRole('button', { name: 'Trash', exact: true }).last().click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('table')).toHaveCount(0);
  await page.getByRole('button', { name: 'Trash', exact: true }).click();
  await page.getByRole('button', { name: 'Open Test headphones' }).click();
  await page.getByRole('button', { name: 'Restore record' }).click();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Active', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('Test headphones');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('subscription payment advances the date and retains history', async ({ page }) => {
  await fresh(page);
  await navigate(page, 'Subscriptions');
  const form = await create(page, 'subscription', 'Monthly test service', '50000');
  await form.getByLabel('Next billing date').fill('2026-01-31');
  await form.getByRole('button', { name: 'Create subscription', exact: true }).click();
  await page.getByRole('button', { name: 'Mark paid', exact: true }).click();
  await expect(page.locator('.subscription-card')).toContainText('Feb 28, 2026');
  await page.getByRole('button', { name: 'Details', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Payment for renewal on 2026-01-31');
});

test('savings deposits connect to a goal and completing it records spending', async ({ page }) => {
  await fresh(page);
  await navigate(page, 'Savings');
  let form = await create(page, 'savings fund', 'Laptop fund', '1000000');
  await form.getByRole('button', { name: 'Create savings fund', exact: true }).click();
  await page.getByRole('button', { name: 'Add savings', exact: true }).click();
  form = page.getByRole('dialog');
  await form.getByLabel('Amount (UZS)').fill('1000000');
  await form.getByRole('button', { name: 'Record deposit' }).click();
  await expect(page.locator('.fund-card')).toContainText('100% saved');
  await navigate(page, 'Purchase goals');
  form = await create(page, 'purchase goal', 'My laptop', '1000000');
  await form.getByLabel('Connect a savings fund').selectOption({ label: 'Laptop fund' });
  await form.getByRole('button', { name: 'Create purchase goal', exact: true }).click();
  await expect(page.locator('.goal-card')).toContainText('100%');
  await page.getByRole('button', { name: 'Open My laptop' }).click();
  await page.getByRole('button', { name: 'Complete purchase', exact: true }).click();
  await page.getByLabel('Actual purchase price (UZS)').fill('900000');
  await page.getByRole('button', { name: 'Complete purchase', exact: true }).click();
  await navigate(page, 'Purchases');
  await expect(page.getByRole('table')).toContainText('My laptop');
  await expect(page.getByRole('table')).toContainText('900,000');
  await navigate(page, 'Savings');
  await expect(page.locator('.fund-card')).toContainText('100,000');
});

test('calendar event, global search and completion work', async ({ page }) => {
  await fresh(page);
  await navigate(page, 'Calendar');
  const form = await create(page, 'event', 'Budget review', '0');
  await form.getByRole('button', { name: 'Create event', exact: true }).click();
  await expect(page.locator('.calendar-grid')).toContainText('Budget review');
  await page.getByLabel('Search everything').fill('Budget review');
  await page.locator('.search-results').getByRole('button').click();
  await page.getByRole('button', { name: 'Complete', exact: true }).click();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.locator('.calendar-grid')).not.toContainText('Budget review');
});

test('backup export, corrupt backup rejection, typography and budget persist', async ({ page }) => {
  await fresh(page);
  await page
    .getByRole('navigation', { name: 'Tools' })
    .getByRole('button', { name: 'Settings' })
    .click();
  await page.getByLabel('Monthly budget', { exact: true }).fill('5000000');
  await page.getByRole('button', { name: 'Save budget', exact: true }).click();
  await page.getByLabel('Typography').selectOption('system');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  expect((await downloaded).suggestedFilename()).toMatch(/^mmv-purchases-.*\.json$/);
  await page.locator('input[type=file]').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.getByRole('status')).toContainText('Import failed');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-font', 'system');
  await expect(page.getByLabel('Monthly budget', { exact: true })).toHaveValue('5000000');
});

test('mobile navigation and layout fit a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A little more in control.' })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await navigate(page, 'Subscriptions');
  await expect(page.getByRole('heading', { name: 'Subscriptions', exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.screenshot({
    path: 'test-results/mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
});

test('production app reloads offline with locally saved records', async ({ page, context }) => {
  await fresh(page);
  await navigate(page, 'Purchases');
  const form = await create(page, 'purchase', 'Offline notebook', '30000');
  await form.getByRole('button', { name: 'Create purchase', exact: true }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBeTruthy();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('table')).toContainText('Offline notebook');
  await context.setOffline(false);
});

test('dashboard renders without runtime errors and all navigation views open', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A little more in control.' })).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true });
  for (const name of ['Purchases', 'Subscriptions', 'Savings', 'Purchase goals', 'Calendar']) {
    await navigate(page, name);
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  await page
    .getByRole('navigation', { name: 'Tools' })
    .getByRole('button', { name: 'Reports' })
    .click();
  await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('core views and entry dialog have no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  for (const view of [
    'Overview',
    'Purchases',
    'Subscriptions',
    'Savings',
    'Purchase goals',
    'Calendar',
  ]) {
    await navigate(page, view);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    ).toEqual([]);
  }
  await navigate(page, 'Purchases');
  await create(page, 'purchase', 'Accessible entry', '100');
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
    })),
  ).toEqual([]);
});

test('light appearance remains readable and restores a validated backup', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Tools' })
    .getByRole('button', { name: 'Settings' })
    .click();
  await page.getByRole('button', { name: 'Warm light', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const backup = await page.evaluate(() => localStorage.getItem('mmv-purchases-v1')!);
  await page.locator('input[type=file]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup),
  });
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await navigate(page, 'Overview');
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
    })),
  ).toEqual([]);
});
