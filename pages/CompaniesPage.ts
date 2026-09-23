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

    const input = await this.waitForFirstVisible(candidates, 5000);

    if (!input) {
      // No search box in this UI - fall back to a plain text assertion.
      await expect(this.page.getByText(name, { exact: false }).first()).toBeVisible({ timeout: 8_000 });
      return;
    }

    await input.fill(name);

    // Wait for the filtered result to actually appear instead of a fixed
    // sleep. react-admin's list filter is debounced, so this replaces the
    // old `waitForTimeout(500)` which was a guess, not a real readiness
    // signal.
    await expect(this.page.getByText(name, { exact: false }).first()).toBeVisible({ timeout: 8_000 });
  }

  async verify(name: string) {
    await expect(this.page.getByText(name, { exact: false }).first()).toBeVisible({ timeout: 8_000 });
  }
}