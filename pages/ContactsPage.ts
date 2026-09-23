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

      this.page.getByRole('link', {
        name: /new contact|create contact/i
      }),

      this.page.getByRole('button', {
        name: /new contact|create contact/i
      }),

      this.page.locator(
        'a[href*="/contacts/create"]'
      )
    ];

    await this.clickFirstVisible(
      candidates
    );
  }

  async search(value: string) {

    const candidates = [

      this.page.getByPlaceholder(
        /search/i
      ),

      this.page.getByRole('textbox', {
        name: /search/i
      }),

      this.page.locator(
        'input[type="search"]'
      )
    ];

    for (const locator of candidates) {

      const input = locator.first();

      if (
        await input.isVisible().catch(() => false)
      ) {

        await input.fill(value);

        /*
         * Wait for the searched value to appear.
         * This is preferable to waitForTimeout().
         */
        await expect(
          this.page.getByText(
            value,
            { exact: false }
          ).first()
        ).toBeVisible({
          timeout: 8_000
        });

        return;
      }
    }

    throw new Error(
      'Could not find a visible Contacts search input.'
    );
  }

  async verifyContact(email: string) {

    await expect(
      this.page.getByText(
        email,
        { exact: false }
      ).first()
    ).toBeVisible({
      timeout: 8_000
    });
  }
}