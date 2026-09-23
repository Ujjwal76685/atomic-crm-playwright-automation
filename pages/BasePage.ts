    import { expect, Locator, Page } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  async clickFirstVisible(candidates: Locator[]) {
    for (const locator of candidates) {
      if (await locator.first().isVisible().catch(() => false)) {
        await locator.first().click();
        return;
      }
    }
    throw new Error('None of the candidate locators was visible.');
  }

  async fillFirstVisible(candidates: Locator[], value: string) {
    for (const locator of candidates) {
      if (await locator.first().isVisible().catch(() => false)) {
        await locator.first().fill(value);
        return;
      }
    }
    throw new Error(`Could not find a visible input to fill with "${value}".`);
  }

  async screenshot(name: string) {
    const path = `screenshots/${name}.png`;
    await this.page.screenshot({ path, fullPage: true });
    return path;
  }

  async expectText(text: string | RegExp) {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }
}
