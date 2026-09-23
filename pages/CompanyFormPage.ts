import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export type CompanyData = {
  name: string;
  website: string;
  phone: string;
};

export class CompanyFormPage extends BasePage {
  private async fillByLabelOrName(labels: string[], names: string[], value: string) {
    const candidates = [
      ...labels.map(x => this.page.getByLabel(new RegExp(`^${x}$`, 'i'))),
      ...names.map(x => this.page.locator(`[name="${x}"]`)),
      ...labels.map(x => this.page.getByPlaceholder(new RegExp(x, 'i')))
    ];
    await this.fillFirstVisible(candidates, value);
  }

  async create(data: CompanyData) {
    await this.fillByLabelOrName(
      ['company name', 'name'],
      ['name'],
      data.name
    );

    // Optional fields: fill when present, but do not fail the assessment if the demo changes which optional company fields are rendered.
    for (const [labels, names, value] of [
      [['website'], ['website'], data.website],
      [['phone', 'phone number'], ['phone', 'phone_number'], data.phone]
    ] as const) {
      const candidates = [
        ...labels.map(x => this.page.getByLabel(new RegExp(`^${x}$`, 'i'))),
        ...names.map(x => this.page.locator(`[name="${x}"]`))
      ];
      const target = await this.waitForFirstVisible(candidates, 2000);
      if (target) {
        await target.fill(value);
      }
    }

    await this.clickFirstVisible([
      this.page.getByRole('button', { name: /^save$/i }),
      this.page.getByRole('button', { name: /save|create/i }),
      this.page.locator('button[type="submit"]')
    ]);

    await this.page.waitForLoadState('domcontentloaded').catch(() => {});

    // Positive confirmation the save actually went through, instead of
    // just assuming a fixed pause was long enough.
    await expect(this.page.getByText(data.name, { exact: false }).first())
      .toBeVisible({ timeout: 10_000 });
  }
}