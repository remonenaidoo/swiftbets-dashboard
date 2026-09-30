import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { signIn, watchCsp } from './support';

const screens = [
  { name: 'Live feed', path: '/' },
  { name: 'Anomalies', path: '/anomalies' },
  { name: 'Incidents', path: '/incidents' },
  { name: 'Fault injection', path: '/faults' },
];

test('the sign-in screen has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Sign in' }).waitFor();

  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});

for (const screen of screens) {
  test(`${screen.name} has no accessibility violations or CSP violations`, async ({ page }) => {
    const violations = await watchCsp(page);
    await signIn(page);
    await page.goto(screen.path);
    await page.getByRole('main').getByRole('heading', { level: 1 }).waitFor();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();

    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    expect(violations).toEqual([]);
  });
}
