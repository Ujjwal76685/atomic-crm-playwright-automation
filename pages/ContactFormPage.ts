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
       ...labels.map(x =>
         this.page.getByLabel(
           new RegExp(`^${x}$`, 'i')
         )
       ),

       ...names.map(x =>
         this.page.locator(`[name="${x}"]`)
       ),

       ...labels.map(x =>
         this.page.getByPlaceholder(
           new RegExp(x, 'i')
         )
       )
     ];

     for (const locator of candidates) {

       const target = locator.first();

       if (
         await target.isVisible().catch(() => false)
       ) {

         await target.fill(value);

         return true;
       }
     }

     return false;
   }

   async create(data: ContactData) {

     /*
      * First Name
      */
     await this.fillOptional(
       ['first name'],
       ['first_name'],
       data.firstName
     );

     /*
      * Last Name
      */
     await this.fillOptional(
       ['last name'],
       ['last_name'],
       data.lastName
     );

     /*
      * Email
      */
     await this.fillOptional(
       ['email'],
       ['email', 'email_jsonb'],
       data.email
     );

     /*
      * Company
      *
      * Atomic CRM uses a Radix/shadcn combobox.
      *
      * The combobox trigger is a <button>, therefore we must
      * click it first and then interact with the search input
      * rendered inside the popover.
      */

     const companyCandidates = [

       this.page.getByLabel(/company/i),

       this.page.getByRole(
         'combobox',
         {
           name: /company/i
         }
       ),

       this.page.locator(
         '[name="company_id"]'
       ),

       this.page.locator(
         'input[placeholder*="company" i]'
       )
     ];

     let companyFilled = false;

     for (const locator of companyCandidates) {

       const target = locator.first();

       if (
         !(await target.isVisible().catch(() => false))
       ) {
         continue;
       }

       const tagName =
         await target
           .evaluate(
             el => el.tagName.toLowerCase()
           )
           .catch(() => '');

       /*
        * Direct input field
        */
       if (
         ['input', 'textarea'].includes(tagName)
       ) {

         await target.fill(
           data.companyName
         );

       } else {

         /*
          * Combobox trigger
          */
         await target.click();

         /*
          * Search input inside Radix dialog
          */
         const popupTextbox =
           this.page
             .getByRole('dialog')
             .getByRole('textbox')
             .first();

         if (
           await popupTextbox
             .isVisible()
             .catch(() => false)
         ) {

           await popupTextbox.fill(
             data.companyName
           );

         } else {

           /*
            * Fallback: locate a visible search/company input.
            */
           const visibleInputs =
             this.page.locator(
               'input:visible'
             );

           const count =
             await visibleInputs.count();

           let filled = false;

           for (
             let i = count - 1;
             i >= 0;
             i--
           ) {

             const input =
               visibleInputs.nth(i);

             const placeholder =
               await input
                 .getAttribute(
                   'placeholder'
                 )
                 .catch(() => null);

             const ariaLabel =
               await input
                 .getAttribute(
                   'aria-label'
                 )
                 .catch(() => null);

             const metadata =
               `${placeholder ?? ''} ${ariaLabel ?? ''}`;

             if (
               /search|company/i.test(
                 metadata
               )
             ) {

               await input.fill(
                 data.companyName
               );

               filled = true;

               break;
             }
           }

           if (!filled) {
             throw new Error(
               'Company combobox opened, but its search input could not be located.'
             );
           }
         }
       }

       /*
        * Wait briefly for the filtered company option
        * to appear.
        */
       await this.page.waitForTimeout(300);

       /*
        * Escape company name before using it in RegExp.
        */
       const escapedCompanyName =
         data.companyName.replace(
           /[.*+?^${}()|[\]\\]/g,
           '\\$&'
         );

       /*
        * Try semantic option first.
        */
       const option =
         this.page
           .getByRole(
             'option',
             {
               name: new RegExp(
                 escapedCompanyName,
                 'i'
               )
             }
           )
           .first();

       if (
         await option
           .isVisible()
           .catch(() => false)
       ) {

         await option.click();

         companyFilled = true;

         break;
       }

       /*
        * Exact text fallback.
        */
       const exactText =
         this.page.getByText(
           data.companyName,
           {
             exact: true
           }
         ).first();

       if (
         await exactText
           .isVisible()
           .catch(() => false)
       ) {

         await exactText.click();

         companyFilled = true;

         break;
       }

       /*
        * Partial text fallback.
        */
       const textMatch =
         this.page.getByText(
           data.companyName,
           {
             exact: false
           }
         ).first();

       if (
         await textMatch
           .isVisible()
           .catch(() => false)
       ) {

         await textMatch.click();

         companyFilled = true;

         break;
       }
     }

     if (!companyFilled) {

       throw new Error(
         `Could not select the Contact -> Company value "${data.companyName}".`
       );
     }

     /*
      * Salesperson
      *
      * Some Atomic CRM versions expose this field.
      * Select the first available option only when
      * the field exists and has no selected value.
      */

     const salesCandidates = [

       this.page.getByLabel(
         /sales|salesperson/i
       ),

       this.page.getByRole(
         'combobox',
         {
           name: /sales|salesperson/i
         }
       ),

       this.page.locator(
         '[name="sales_id"]'
       )
     ];

     for (const locator of salesCandidates) {

       const target = locator.first();

       if (
         await target
           .isVisible()
           .catch(() => false)
       ) {

         const value =
           await target
             .inputValue()
             .catch(() => '');

         if (!value) {

           await target.click();

           const firstOption =
             this.page
               .getByRole('option')
               .first();

           if (
             await firstOption
               .isVisible()
               .catch(() => false)
           ) {

             await firstOption.click();
           }
         }

         break;
       }
     }

     /*
      * Save / Create Contact
      */

     await this.clickFirstVisible([

       this.page.getByRole(
         'button',
         {
           name: /^save$/i
         }
       ),

       this.page.getByRole(
         'button',
         {
           name: /save|create/i
         }
       ),

       this.page.locator(
         'button[type="submit"]'
       )
     ]);

     /*
      * Wait for the save/navigation operation to settle.
      *
      * IMPORTANT:
      *
      * We intentionally DO NOT verify firstName here.
      *
      * ContactFormPage = creation responsibility.
      * ContactsPage = search and verification responsibility.
      */
     await this.page
       .waitForLoadState(
         'domcontentloaded'
       )
       .catch(() => {});

     /*
      * Small rendering buffer for the React UI.
      * The actual verification happens after navigating
      * back to ContactsPage.
      */
     await this.page.waitForTimeout(500);
   }
 }

