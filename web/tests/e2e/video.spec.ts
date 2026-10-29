import { test, expect } from '@playwright/test';
test('record the demo journey',async({page})=>{
  const hold = () => page.waitForTimeout(7000);
  await page.goto('/?offline=1&now=12:05'); await page.waitForTimeout(2000); await hold();
  await page.getByRole('link',{name:'Try it for yourself'}).click(); await page.goto('/chat?offline=1&now=12:05');
  await expect(page.locator('[data-card-type="context_prompt"]')).toBeVisible(); await page.waitForTimeout(2000); await hold();
  await page.getByRole('button',{name:'Paste a sample TikTok link'}).click(); await expect(page.locator('[data-card-type="tiktok_result"]')).toBeVisible(); await page.waitForTimeout(2000); await hold();
  await page.getByRole('button',{name:'Translate a sample menu'}).click(); await expect(page.locator('[data-card-type="menu_translation"]')).toBeVisible(); await page.waitForTimeout(2000); await hold();
  await page.getByRole('button',{name:'Is 300k for a cyclo ride fair?'}).click(); await expect(page.locator('[data-card-type="price_check"]')).toBeVisible(); await page.waitForTimeout(2000); await hold();
  await page.locator('.quick-replies').getByRole('button',{name:'Nearby',exact:true}).click(); await expect(page.locator('[data-card-type="place_cards"]').last()).toBeVisible(); await page.waitForTimeout(2000); await hold();
  await page.getByRole('button',{name:'Plan my day in District 1, I love night food, budget 800k'}).click(); await expect(page.locator('[data-card-type="itinerary"]')).toBeVisible(); await page.getByRole('button',{name:'Your itinerary'}).click(); await page.waitForTimeout(2000); await hold(); await page.getByRole('button',{name:'Your itinerary'}).click();
  await page.getByRole('button',{name:'Simulated ▾'}).click(); await page.getByRole('button',{name:'Rain',exact:true}).click(); await expect(page.locator('[data-card-type="replan"]')).toBeVisible(); await page.waitForTimeout(2000); await hold(); await page.getByRole('button',{name:'Accept',exact:true}).click();
  await page.goto('/business'); await page.waitForTimeout(2000); await hold(); for(let i=0;i<4;i++){await page.mouse.wheel(0,600);await page.waitForTimeout(2000)}
});
