import { expect, test } from '@playwright/test';

test('E2E-01: requester logs in, creates a request, views list and persisted detail after reload', async ({
  page,
}) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('oum.requester@cpe334.local');
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/requests\/my$/);

  await page.getByRole('link', { name: 'New Request' }).first().click();
  await expect(page).toHaveURL(/\/requests\/new$/);

  const uniqueTitle = `E2E Monitor Stand ${Date.now()}`;
  await page.getByLabel('Request Title').fill(uniqueTitle);
  await page.getByLabel('Amount (THB)').fill('2450');
  await page.getByLabel('Category').selectOption('EQUIPMENT');
  await page.getByLabel(/Description/i).fill('Ergonomic stand for Sprint 1 workstation');

  await page.getByRole('button', { name: 'Submit Request' }).click();

  await expect(page).toHaveURL(/\/requests\/[0-9a-f-]+$/i);
  await expect(page.getByText(uniqueTitle)).toBeVisible();
  await expect(page.getByText('PENDING')).toBeVisible();
  await expect(page.getByText(/SUBMITTED/)).toBeVisible();

  // Reload to verify persistence
  await page.reload();
  await expect(page.getByText(uniqueTitle)).toBeVisible();
  await expect(page.getByText('2,450.00 THB')).toBeVisible();

  // Verify it appears in My Requests
  await page.getByRole('link', { name: 'My Requests' }).first().click();
  await expect(page).toHaveURL(/\/requests\/my$/);
  await expect(page.getByText(uniqueTitle)).toBeVisible();
});
