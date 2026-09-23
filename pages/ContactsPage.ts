import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ContactsPage extends BasePage {

  async goto() {
    await this.page.goto('#/contacts', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000
    });
  }

  async openCreate() {
    const candidates = [
      this.page.getByRole('link', { name: /new contact|create contact/i }),
      this.page.getByRole('button', { name: /new contact|create contact/i }),
      this.page.locator('a[href*="/contacts/create"]')
    ];
    await this.clickFirstVisible(candidates);
  }

  /**
   * Filters the Contacts list and waits for a matching row to render.
   *
   * IMPORTANT: search/verify by something guaranteed to be rendered as
   * visible text in the Datagrid - the contact's full name. Atomic CRM's
   * Contacts grid shows Name / Company / Tags columns; it does NOT render
   * the raw email address in the row, even though the underlying filter
   * can still match against email server-side. Asserting that an email
   * string is visible *in the grid* fails even when the filter worked
   * correctly and the right contact is on screen - the text assertion,
   * not the filter, was wrong. Use `verifyDetails()` below to confirm the
   * email/company on the contact's own detail page instead.
   */
  async search(term: string) {
    const candidates = [
      this.page.getByPlaceholder(/search/i),
      this.page.getByRole('textbox', { name: /search/i }),
      this.page.locator('input[type="search"]')
    ];

    const input = await this.waitForFirstVisible(candidates, 5000);
    if (!input) {
      throw new Error('Could not find a visible Contacts search input.');
    }

    await input.fill(term);

    await expect(
      this.page.getByText(term, { exact: false }).first()
    ).toBeVisible({ timeout: 8_000 });
  }

  /** Opens the first row in the current (filtered) list, by clicking on
   *  the same text that was just used to filter/verify it. */
  async openFirstResult(term: string) {
    await this.page.getByText(term, { exact: false }).first().click();
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  /**
   * Verifies the contact's detail/show view contains both the expected
   * email and, when provided, the linked Company name. This is stronger
   * than grid text matching: it confirms the record's data AND the
   * Company relationship were actually saved, not just that a row exists.
   */
  async verifyDetails(email: string, companyName?: string) {
    await expect(this.page.getByText(email, { exact: false }).first())
      .toBeVisible({ timeout: 8_000 });

    if (companyName) {
      await expect(this.page.getByText(companyName, { exact: false }).first())
        .toBeVisible({ timeout: 8_000 });
    }
  }

  /** Retained for backward compatibility with older callers - prefer
   *  search-by-name + verifyDetails() for new code (see comment above). */
  async verifyContact(email: string) {
    await expect(this.page.getByText(email, { exact: false }).first())
      .toBeVisible({ timeout: 8_000 });
  }
}