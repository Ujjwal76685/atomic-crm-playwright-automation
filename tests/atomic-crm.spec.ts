import { test } from '@playwright/test';

import { CompaniesPage } from '../pages/CompaniesPage.js';
import { CompanyFormPage } from '../pages/CompanyFormPage.js';

import { ContactsPage } from '../pages/ContactsPage.js';
import { ContactFormPage } from '../pages/ContactFormPage.js';

import { generateTestData } from '../utils/test-data.js';
import { logStep } from '../utils/logger.js';


test.describe(
  'Atomic CRM - Company and Contact workflow',
  () => {

    test(
      'creates a dynamic company, linked contact, and verifies both',
      async ({ page }) => {

        /*
         * --------------------------------------------------
         * TEST DATA
         * --------------------------------------------------
         */

        const data = generateTestData();
        const contactFullName = `${data.contact.firstName} ${data.contact.lastName}`;


        /*
         * --------------------------------------------------
         * PAGE OBJECTS
         * --------------------------------------------------
         */

        const companies =
          new CompaniesPage(page);

        const companyForm =
          new CompanyFormPage(page);

        const contacts =
          new ContactsPage(page);

        const contactForm =
          new ContactFormPage(page);


        /*
         * --------------------------------------------------
         * OPEN APPLICATION
         * --------------------------------------------------
         */

        logStep(
          `Opening Atomic CRM: ${
            process.env.BASE_URL ||
            'default demo URL'
          }`
        );

        await page.goto('./', {
          waitUntil: 'commit',
          timeout: 60_000
        });

        await page
          .locator('#root')
          .waitFor({
            state: 'attached',
            timeout: 30_000
          })
          .catch(() => {});


        /*
         * --------------------------------------------------
         * COMPANY
         * --------------------------------------------------
         */

        logStep(
          'Navigating to Companies'
        );

        await companies.goto();


        logStep(
          `Creating company: ${data.company.name}`
        );

        await companies.openCreate();

        await companyForm.create(
          data.company
        );

        await companyForm.screenshot(
          '01-company-created'
        );


        /*
         * --------------------------------------------------
         * VERIFY COMPANY
         * --------------------------------------------------
         */

        logStep(
          `Searching and verifying company: ${
            data.company.name
          }`
        );

        await companies.goto();

        await companies.search(
          data.company.name
        );

        await companies.verify(
          data.company.name
        );

        await companyForm.screenshot(
          '02-company-search-verified'
        );


        /*
         * --------------------------------------------------
         * CONTACT
         * --------------------------------------------------
         */

        logStep(
          'Navigating to Contacts'
        );

        await contacts.goto();


        logStep(
          `Creating contact: ${
            data.contact.email
          }`
        );

        await contacts.openCreate();


        await contactForm.create({
          firstName:
            data.contact.firstName,

          lastName:
            data.contact.lastName,

          email:
            data.contact.email,

          companyName:
            data.company.name
        });


        await contactForm.screenshot(
          '03-contact-created'
        );


        /*
         * --------------------------------------------------
         * VERIFY CONTACT
         *
         * Search/verify the grid by full NAME - Atomic CRM's Contacts
         * Datagrid renders Name/Company/Tags, not the raw email, so
         * asserting the email string is visible *in the grid* fails even
         * when the correct contact is on screen. Email + the Company link
         * are instead confirmed on the contact's own detail page, which is
         * a stronger check anyway (it verifies saved data, not just that a
         * row rendered).
         * --------------------------------------------------
         */

        logStep(
          `Searching and verifying contact: ${contactFullName}`
        );

        await contacts.goto();

        await contacts.search(
          contactFullName
        );

        await contacts.openFirstResult(
          contactFullName
        );

        await contacts.verifyDetails(
          data.contact.email,
          data.company.name
        );

        await contacts.screenshot(
          '04-contact-search-verified'
        );


        /*
         * --------------------------------------------------
         * COMPLETE
         * --------------------------------------------------
         */

        logStep(
          'End-to-end workflow completed successfully'
        );
      }
    );
  }
);