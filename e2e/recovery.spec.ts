import { expect, test } from '@playwright/test';
import { listIncidents, placeBetsInBackground, signIn, watchCsp } from './support';

test('inject a stuck coupon, see it diagnosed, approve the fix, and watch it recover', async ({ page, request }) => {
  const violations = await watchCsp(page);
  const stopBetting = await placeBetsInBackground(request);
  try {
    await signIn(page);
    await expect(page.getByRole('status').filter({ hasText: 'Live' })).toBeVisible();

    const before = new Set((await listIncidents(page)).map((i) => i.incidentId));

    await page.getByRole('link', { name: 'Fault injection' }).click();
    await page.getByRole('button', { name: 'Inject stuck coupon' }).click();
    await expect(page.getByText(/armed settlement\.settler\.drop/)).toBeVisible();

    // The reconciler reports the coupon, Steward diagnoses it, and the incident list updates over the live hub.
    await page.getByRole('link', { name: 'Incidents' }).click();
    // Only an incident opened by this drill counts; the list must show it without a reload.
    let fresh: string | undefined;
    await expect(async () => {
      const incidents = await listIncidents(page);
      fresh = incidents.find((i) => !before.has(i.incidentId) && i.kind === 'stuckCoupon' && i.status === 'awaitingApproval')?.incidentId;
      expect(fresh).toBeDefined();
    }).toPass({ timeout: 4 * 60_000, intervals: [2_000] });
    const link = page.locator(`a[href="/incidents/${fresh}"]`);
    await expect(link).toContainText('Awaiting approval');
    await link.click();

    const detail = page.getByRole('region', { name: 'Incident detail' });
    await expect(detail.getByRole('heading', { name: /Diagnosis/ })).toBeVisible();
    await expect(detail.getByText('Refresh coupon')).toBeVisible();

    await detail.getByRole('button', { name: 'Approve' }).click();

    await expect(detail.getByText('Executed')).toBeVisible();
    await expect(detail.getByText('Resolved').first()).toBeVisible();
  } finally {
    await stopBetting();
  }

  expect(violations).toEqual([]);
});
