import { expect, test } from '@playwright/test';

// Flows behind the pitch deck: late phở answer, routes, contributions, reports, the partner
// chat box and demand stats. They run without a model (CI sets AI_MODE=off).
const ask = async (page: import('@playwright/test').Page, text: string) => {
  await page.locator('.composer input[type=text]').fill(text);
  await page.locator('.composer').evaluate(form => (form as HTMLFormElement).requestSubmit());
};

test('the late phở question answers with the 24-hour phở shop and its source', async ({ page }) => {
  await page.goto('/chat');
  await ask(page, 'Gần đây có quán phở nào mở khuya không?');
  const card = page.locator('.place-card').first();
  await expect(card.locator('h3')).toHaveText('Phở Quỳnh');
  await expect(card).toContainText('Open 24 hours');
  await expect(card.locator('.source-label').first()).toHaveText('Reference');
  await expect(card.getByRole('link', { name: /Directions/ })).toBeVisible();
});

test('a backpacking question suggests a route that can be followed and rated', async ({ page }) => {
  await page.goto('/chat');
  await page.getByRole('button', { name: 'Suggest a backpacking day by metro' }).click();
  const route = page.locator('[data-card-type="route"]').first();
  await expect(route.locator('h3')).toHaveText('A day in Saigon by metro and on foot');
  await expect(route).toContainText('Green travel');
  await route.getByRole('button', { name: '5/5' }).click();
  await expect(route).toContainText('Thanks for rating');
  await route.getByRole('button', { name: 'Follow this route' }).click();
  await page.getByRole('button', { name: 'Your itinerary' }).click();
  await expect(page.locator('.itinerary-sheet .stop').first()).toContainText('Ben Thanh');
});

test('a posted route waits for review and its author sees it', async ({ page }) => {
  await page.goto('/lo-trinh');
  await expect(page.locator('[data-card-type="route"]')).toHaveCount(3);
  await page.getByRole('link', { name: 'Post a route' }).click();
  await page.getByLabel('Display name').fill('E2E Walker');
  await page.getByLabel('Route title').fill('E2E morning walk');
  const picker = page.getByLabel('Choose a place');
  for (const id of ['q1-001', 'q1-018']) { await picker.selectOption(id); await page.getByRole('button', { name: 'Add', exact: true }).click(); }
  await page.getByRole('button', { name: 'Send route' }).click();
  await expect(page.getByRole('heading', { name: 'Route sent' })).toBeVisible();
  await page.goto('/lo-trinh');
  await expect(page.locator('[data-card-type="route"]', { hasText: 'E2E morning walk' })).toContainText('Waiting for review');
});

test('a business sends an hours update for review', async ({ page }) => {
  await page.goto('/dong-gop');
  await page.getByRole('radio', { name: /Keep your own details current/ }).click();
  await page.getByLabel('Place').selectOption('q1-019');
  await page.getByLabel('Open 24 hours').check();
  await page.getByLabel('Business name').fill('Bún chả 145');
  await page.getByRole('button', { name: 'Send for review' }).click();
  await expect(page.getByRole('status')).toContainText('Received, waiting for review');
});

test('a traveller reports a mistake on a card', async ({ page }) => {
  await page.goto('/chat');
  await ask(page, 'Gần đây có quán phở nào mở khuya không?');
  const card = page.locator('.place-card').first();
  await card.getByRole('button', { name: 'Report a mistake' }).click();
  await card.getByRole('button', { name: 'Opening hours' }).click();
  await card.getByRole('button', { name: 'Send report' }).click();
  await expect(card.getByRole('status')).toContainText('within 24 hours');
});

test('a partner site shows the chat box under its own name', async ({ page, request }) => {
  expect((await request.get('/embed')).headers()['x-frame-options']).toBeUndefined();
  expect((await request.get('/chat')).headers()['x-frame-options']).toBe('DENY');
  await page.goto('/demo/tour-cua-ban');
  const box = page.frameLocator('iframe[title="Trợ lý Tour Của Bạn"]');
  await expect(box.locator('.embed-brand')).toContainText('Trợ lý Tour Của Bạn');
  await expect(box.locator('.embed-brand')).toContainText('chạy bằng Ask Saigon');
  await box.locator('.composer input[type=text]').fill('Gần đây có quán phở nào mở khuya không?');
  await box.locator('.composer').evaluate(form => (form as HTMLFormElement).requestSubmit());
  await expect(box.locator('.place-card h3').first()).toHaveText('Phở Quỳnh');
  await page.goto('/thong-ke');
  await page.getByRole('button', { name: /Tour Của Bạn/ }).click();
  await expect(page.locator('.stat-big')).not.toHaveText('0');
});

test('a hotel guest app runs the assistant in the guest language', async ({ page }) => {
  await page.goto('/demo/khach-san-cua-ban');
  await expect(page.frameLocator('iframe[title="Khách Sạn Của Bạn assistant"]').locator('.embed-brand')).toContainText('Assistant Khách Sạn Của Bạn');
  await page.getByRole('button', { name: 'Tiếng Việt' }).click();
  await expect(page.frameLocator('iframe[title="Trợ lý Khách Sạn Của Bạn"]').locator('.embed-brand')).toContainText('chạy bằng Ask Saigon');
});

test('the public data API answers any origin with checked places', async ({ request }) => {
  const res = await request.get('/api/v1/places?q=' + encodeURIComponent('phở mở khuya'), { headers: { origin: 'https://partner.example' } });
  expect(res.headers()['access-control-allow-origin']).toBe('*');
  const body = await res.json();
  expect(body.places.map((p: { name: string }) => p.name)).toContain('Phở Quỳnh');
});
