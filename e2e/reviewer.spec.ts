import { expect, test, type Page } from '@playwright/test';

const PASSWORD = 'Password123!';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

async function logout(page: Page) {
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

async function createEquipmentRequest(page: Page, title: string) {
  await page.getByRole('link', { name: 'New Request' }).first().click();
  await expect(page).toHaveURL(/\/requests\/new$/);

  await page.getByLabel('Request Title').fill(title);
  await page.getByLabel('Amount (THB)').fill('1800');
  await page.getByLabel('Category').selectOption('EQUIPMENT');
  await page.getByLabel(/Description/i).fill('Created for reviewer E2E coverage');
  await page.getByRole('button', { name: 'Submit Request' }).click();

  await expect(page).toHaveURL(/\/requests\/[0-9a-f-]+$/i);
  await expect(page.getByText(title)).toBeVisible();
  return page.url().split('/').pop() as string;
}

test('E2E-02: assigned reviewer approves a request from the pending queue and history is appended', async ({
  page,
}) => {
  const uniqueTitle = `E2E Review Approve ${Date.now()}`;

  await login(page, 'oum.requester@cpe334.local');
  await expect(page).toHaveURL(/\/requests\/my$/);
  await createEquipmentRequest(page, uniqueTitle);
  await logout(page);

  await login(page, 't.reviewer@cpe334.local');
  await expect(page).toHaveURL(/\/reviewer\/pending$/);

  const row = page.getByRole('row', { name: new RegExp(uniqueTitle) });
  await expect(row).toBeVisible();
  await row.getByRole('link', { name: 'Review' }).click();

  await expect(page).toHaveURL(/\/reviewer\/requests\/[0-9a-f-]+$/i);
  await expect(page.getByText(uniqueTitle)).toBeVisible();
  await expect(page.getByText('PENDING', { exact: true })).toBeVisible();

  await page.getByRole('radio', { name: 'Approve' }).check();
  await page.getByLabel(/Comment/i).fill('Approved for project use');
  await page.getByRole('button', { name: 'Submit Decision' }).click();

  await expect(page.getByText(/Decision recorded: request is now APPROVED/i)).toBeVisible();
  await expect(page.getByText('APPROVED', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/APPROVED\s+by T Reviewer/)).toBeVisible();
  await expect(page.getByText('Approved for project use')).toBeVisible();

  await page.getByRole('link', { name: 'Pending Reviews', exact: true }).click();
  await expect(page).toHaveURL(/\/reviewer\/pending$/);
  await expect(page.getByText(uniqueTitle)).toHaveCount(0);
});

test('E2E-03: reviewer cannot approve their own request (BR-01)', async ({ page }) => {
  const uniqueTitle = `E2E Self Approval ${Date.now()}`;

  await login(page, 'manager.hybrid@cpe334.local');
  await expect(page).toHaveURL(/\/reviewer\/pending$/);

  // EQUIPMENT requests from manager.hybrid are assigned to t.reviewer (BR-05),
  // so the request is reachable as owner but must not be decidable.
  const requestId = await createEquipmentRequest(page, uniqueTitle);

  await page.goto(`/reviewer/requests/${requestId}`);
  await expect(page.getByText(uniqueTitle)).toBeVisible();
  await expect(page.getByText(/Self-approval is forbidden/i)).toBeVisible();

  await page.getByRole('radio', { name: 'Approve' }).check();
  await page.getByRole('button', { name: 'Submit Decision' }).click();

  await expect(page.getByRole('alert')).toContainText('SELF_APPROVAL_NOT_ALLOWED');
  await expect(page.getByText('PENDING', { exact: true })).toBeVisible();
});
