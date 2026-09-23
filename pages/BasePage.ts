import { expect, Locator, Page } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Polls all candidate locators repeatedly until one becomes visible, or
   * the timeout elapses.
   *
   * This replaces the old pattern of calling `.isVisible()` ONCE per
   * candidate: a single-shot check reads the DOM at one exact instant, so
   * if the target hasn't rendered yet at that instant (a debounced filter,
   * a Radix popover animation, a re-render after save) it is skipped even
   * though it would have appeared 100ms later. That single-shot pattern is
   * the main reason this suite behaved differently in headed vs. headless
   * mode: the two environments render/settle on slightly different
   * schedules, so a check that isn't actually "waiting" for anything is a
   * coin flip across environments. Polling with a real deadline removes
   * that race.
   */
  protected async firstVisible(candidates: Locator[], timeout = 5000): Promise<Locator | null> {
    const deadline = Date.now() + timeout;
    do {
      for (const locator of candidates) {
        if (await locator.first().isVisible().catch(() => false)) {
          return locator.first();
        }
      }
      await this.page.waitForTimeout(100);
    } while (Date.now() < deadline);
    return null;
  }

  /** Public entry point for page objects that need to branch on *which*
   *  candidate matched (e.g. checking tag name) rather than just click/fill. */
  async waitForFirstVisible(candidates: Locator[], timeout = 5000): Promise<Locator | null> {
    return this.firstVisible(candidates, timeout);
  }

  async clickFirstVisible(candidates: Locator[], timeout = 5000) {
    const target = await this.firstVisible(candidates, timeout);
    if (!target) {
      throw new Error('None of the candidate locators became visible in time.');
    }
    await target.click();
  }

  async fillFirstVisible(candidates: Locator[], value: string, timeout = 5000) {
    const target = await this.firstVisible(candidates, timeout);
    if (!target) {
      throw new Error(`Could not find a visible input to fill with "${value}".`);
    }
    await target.fill(value);
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