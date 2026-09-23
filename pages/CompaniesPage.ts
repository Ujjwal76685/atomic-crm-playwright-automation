import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class CompaniesPage extends BasePage {
  async goto() {
    await this.page.goto('#/companies');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openCreate() {
    const candidates = [
      this.page.getByRole('link', { name: /new company|create company/i }),
      this.page.getByRole('button', { name: /new company|create company/i }),
      this.page.locator('a[href*="/companies/create"]')
    ];
    await this.clickFirstVisible(candidates);
  }

  async search(name: string) {
    const candidates = [
      this.page.getByPlaceholder(/search/i),
      this.page.getByRole('textbox', { name: /search/i }),
      this.page.locator('input[type="search"]')
    ];
    for (const locator of candidates) {
      if (await locator.first().isVisible().catch(() => false)) {
        await locator.first().fill(name);
        await this.page.waitForTimeout(500);
        return;
      }
    }
    // If the current UI has no search box, use the browser find-like text assertion.
    await expect(this.page.getByText(name, { exact: false }).first()).toBeVisible();
  }

  async verify(name: string) {
    await expect(this.page.getByText(name, { exact: false }).first()).toBeVisible();
  }
}
