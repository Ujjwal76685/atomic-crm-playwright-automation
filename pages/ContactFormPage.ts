import { BasePage } from './BasePage.js';

export type ContactData = {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
};

export class ContactFormPage extends BasePage {

  private async fillOptional(
    labels: string[],
    names: string[],
    value: string
  ) {
    const candidates = [
      ...labels.map(x => this.page.getByLabel(new RegExp(`^${x}$`, 'i'))),
      ...names.map(x => this.page.locator(`[name="${x}"]`)),
      ...labels.map(x => this.page.getByPlaceholder(new RegExp(x, 'i')))
    ];

    const target = await this.waitForFirstVisible(candidates, 3000);
    if (!target) return false;

    await target.fill(value);
    return true;
  }

  async create(data: ContactData) {

    /*
     * First Name / Last Name / Email
     */
    await this.fillOptional(['first name'], ['first_name'], data.firstName);
    await this.fillOptional(['last name'], ['last_name'], data.lastName);
    await this.fillOptional(['email'], ['email', 'email_jsonb'], data.email);

    /*
     * Company
     *
     * Atomic CRM uses a Radix/shadcn combobox. The combobox trigger is a
     * <button>, so we have to click it first and then interact with the
     * search input rendered inside the popover.
     */
    const companyCandidates = [
      this.page.getByLabel(/company/i),
      this.page.getByRole('combobox', { name: /company/i }),
      this.page.locator('[name="company_id"]'),
      this.page.locator('input[placeholder*="company" i]')
    ];

    const companyTarget = await this.waitForFirstVisible(companyCandidates, 5000);
    if (!companyTarget) {
      throw new Error('Could not find the Contact -> Company field on the create form.');
    }

    const tagName = await companyTarget.evaluate(el => el.tagName.toLowerCase()).catch(() => '');

    if (['input', 'textarea'].includes(tagName)) {
      // Direct input field.
      await companyTarget.fill(data.companyName);
    } else {
      // Combobox trigger - open it.
      await companyTarget.click();

      const popupTextbox = this.page.getByRole('dialog').getByRole('textbox').first();
      const popupTextboxVisible = await popupTextbox.isVisible({ timeout: 2000 }).catch(() => false);

      if (popupTextboxVisible) {
        await popupTextbox.fill(data.companyName);
      } else {
        // Fallback: locate a visible search/company input, waiting for it
        // to actually render instead of checking once.
        const visibleInputs = this.page.locator('input:visible');
        const deadline = Date.now() + 3000;
        let filled = false;

        while (Date.now() < deadline && !filled) {
          const count = await visibleInputs.count();
          for (let i = count - 1; i >= 0; i--) {
            const input = visibleInputs.nth(i);
            const placeholder = await input.getAttribute('placeholder').catch(() => null);
            const ariaLabel = await input.getAttribute('aria-label').catch(() => null);
            const metadata = `${placeholder ?? ''} ${ariaLabel ?? ''}`;

            if (/search|company/i.test(metadata)) {
              await input.fill(data.companyName);
              filled = true;
              break;
            }
          }
          if (!filled) await this.page.waitForTimeout(100);
        }

        if (!filled) {
          throw new Error('Company combobox opened, but its search input could not be located.');
        }
      }
    }

    /*
     * Wait for the filtered option to actually render - this replaces the
     * old fixed `waitForTimeout(300)`, which was the main source of
     * headed/headless flakiness: 300ms was a guess, not a real signal, so
     * whichever environment happened to render slower than that lost the
     * race and silently fell through to a weaker fallback below.
     */
    await this.page.getByRole('option').first()
      .waitFor({ state: 'visible', timeout: 5000 })
      .catch(() => { /* no options rendered - fallbacks below will handle it */ });

    const escapedCompanyName = data.companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const option = this.page.getByRole('option', { name: new RegExp(escapedCompanyName, 'i') }).first();
    const exactText = this.page.getByText(data.companyName, { exact: true }).first();

    let companyFilled = false;

    if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
      await option.click();
      companyFilled = true;
    } else if (await exactText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exactText.click();
      companyFilled = true;
    }

    // Deliberately NO partial-text fallback here anymore: matching *any*
    // element on the page containing a substring of the company name was
    // the riskiest part of the old logic - it could click an unrelated
    // element (e.g. something behind the popover) and report "success"
    // without ever actually selecting the company. Failing loudly here is
    // far more useful than silently continuing.
    if (!companyFilled) {
      throw new Error(
        `Could not select the Contact -> Company value "${data.companyName}" ` +
        `(no matching option/exact-text match appeared).`
      );
    }

    // Confirm the popover actually closed / selection registered before
    // moving on to Save - if it's still open, something didn't take.
    await this.page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});

    /*
     * Salesperson (optional field on some Atomic CRM versions).
     * Select the first available option only when the field exists and
     * has no value yet.
     */
    const salesCandidates = [
      this.page.getByLabel(/sales|salesperson/i),
      this.page.getByRole('combobox', { name: /sales|salesperson/i }),
      this.page.locator('[name="sales_id"]')
    ];

    const salesTarget = await this.waitForFirstVisible(salesCandidates, 2000);
    if (salesTarget) {
      const value = await salesTarget.inputValue().catch(() => '');
      if (!value) {
        await salesTarget.click();
        const firstOption = this.page.getByRole('option').first();
        // Wait for the option to render instead of a single-shot check.
        const optionReady = await firstOption.isVisible({ timeout: 3000 }).catch(() => false);
        if (optionReady) {
          await firstOption.click();
        }
      }
    }

    /*
     * Save / Create Contact
     */
    await this.clickFirstVisible([
      this.page.getByRole('button', { name: /^save$/i }),
      this.page.getByRole('button', { name: /save|create/i }),
      this.page.locator('button[type="submit"]')
    ]);

    /*
     * Positive confirmation the save actually succeeded, instead of a
     * blind `waitForTimeout(500)`. This is the key structural fix: if
     * validation blocked the submit (e.g. Company/Sales wasn't really
     * selected), we now fail HERE with a clear message, rather than
     * several steps later when the final "search by email" assertion
     * mysteriously can't find a contact that was never actually created.
     */
    const validationError = this.page
      .getByText(/required|must be|is invalid/i)
      .first();

    const result = await Promise.race([
      this.page.waitForURL(/#\/contacts(?!\/create)/, { timeout: 10_000 }).then(() => 'navigated' as const),
      validationError.waitFor({ state: 'visible', timeout: 10_000 }).then(() => 'validation-error' as const),
    ]).catch(() => 'timeout' as const);

    if (result === 'validation-error') {
      throw new Error(
        'Contact form still shows a validation error after clicking Save - ' +
        'the Company/Sales selection likely did not register.'
      );
    }
    if (result === 'timeout') {
      throw new Error(
        'Neither a navigation away from the create form nor a validation ' +
        'error was observed after Save - the contact may not have been created.'
      );
    }

    // Small rendering buffer for the React UI before the caller screenshots.
    await this.page.waitForTimeout(200);
  }
}