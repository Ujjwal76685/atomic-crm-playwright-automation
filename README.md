# Atomic CRM — Playwright Automation Case Study

A scalable TypeScript + Playwright automation solution for the Atomic CRM public demo.

## Assessment workflow

1. Open Atomic CRM
2. Navigate to Companies
3. Create a company using dynamically generated data
4. Navigate to Contacts
5. Create a contact linked to the company created in the same execution
6. Search and verify the company
7. Search and verify the contact
8. Capture evidence
9. Generate Playwright HTML output and a shareable PDF execution summary

## Tech stack

- Playwright Test
- TypeScript
- Page Object Model
- Environment variables via dotenv
- PDF generation with pdf-lib
- GitHub Actions
- Optional Playwright MCP server

## Project structure

```text
atomic-crm-playwright-assessment/
├── pages/
│   ├── BasePage.ts
│   ├── CompaniesPage.ts
│   ├── CompanyFormPage.ts
│   ├── ContactsPage.ts
│   └── ContactFormPage.ts
├── tests/
│   └── atomic-crm.spec.ts
├── utils/
│   ├── logger.ts
│   ├── pdf-reporter.ts
│   └── test-data.ts
├── reports/
├── screenshots/
├── .github/workflows/playwright.yml
├── .env.example
├── package.json
├── playwright.config.ts
└── README.md
```

## Prerequisites

- Node.js 22 LTS
- npm
- Chromium installed by Playwright

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

The public demo does not require credentials. If a future environment requires authentication, keep credentials in `.env` locally and CI secrets in the CI/CD platform.

## Execute
Execution Mode: The automation can be executed in both headed and headless Chromium modes. Headed mode is recommended for demonstration because it provides visual evidence of the complete end-to-end workflow. The test has also been configured with Playwright screenshots, video and trace artifacts for failure diagnostics.

Headed mode:

```bash
npm run test:headed
```

Debug mode:

```bash
npm run test:debug
```

Open the HTML report:

```bash
npm run report
```

The PDF is generated automatically at:

```text
reports/execution-report.pdf
```

Evidence is stored under:

```text
screenshots/
```

## Framework design

### Page Object Model

Business interactions are separated from test orchestration:

- `CompaniesPage` — company navigation, create navigation, search and verification
- `CompanyFormPage` — company creation
- `ContactsPage` — contact navigation, search and verification
- `ContactFormPage` — contact creation and company association
- `BasePage` — reusable locator and screenshot helpers

This keeps test cases readable and reduces duplication.

### Dynamic data

Every execution generates a unique identifier from the timestamp plus a random suffix.

Example:

```text
PW Automation Corp 1750000000000-4821
Auto17500000000004821 Tester
playwright.17500000000004821@example.com
```

This avoids collisions between runs.

### Locator strategy

The framework prefers semantic Playwright locators:

- `getByRole`
- `getByLabel`
- `getByPlaceholder`

with attribute-based fallbacks for application-specific fields. Hard-coded CSS position selectors and arbitrary waits are avoided.

### Synchronization

The test uses Playwright's locator auto-waiting and assertions rather than fixed `waitForTimeout` calls for application synchronization.

## Secure credential handling

No credentials are hard-coded.

`.env` is ignored by Git and `.env.example` contains only placeholder configuration.

For CI:

```text
GitHub Actions secret/variable
        ↓
Environment variable
        ↓
Playwright configuration
```

Never commit passwords, API tokens, cookies or authenticated browser state.

## Reporting and evidence

Playwright HTML reporting is enabled.

Failure diagnostics:

- Screenshot on failure
- Trace on failure
- Video on failure

The custom PDF reporter summarizes:

- execution status
- total/passed/failed/skipped counts
- test names
- durations
- errors
- framework characteristics

## AI Agents / MCP

AI/MCP is intentionally treated as an enhancement rather than the source of truth for test results.

The repository exposes an optional command:

```bash
npm run mcp
```

Potential uses include:

1. Locator discovery
2. Test scaffolding
3. Failure analysis using trace/screenshot information
4. Test maintenance suggestions
5. Report summarization

Deterministic Playwright assertions remain responsible for pass/fail decisions.

## CI/CD

GitHub Actions runs the suite on pushes and pull requests.

Artifacts include:

- Playwright HTML report
- PDF execution report
- Playwright diagnostics

## Troubleshooting

### Navigation timeout

The public demo can keep background resources open, so the framework waits for `domcontentloaded` rather than the full `load` event. The initial navigation timeout is 60 seconds.

### PDF encoding

Playwright errors can contain terminal/ANSI control characters. The custom PDF reporter sanitizes control characters before writing them with pdf-lib's standard WinAnsi font.

## Demo limitations

The assessment targets the public Atomic CRM demo. The upstream project documents a FakeRest/demo data provider whose data resets on page reload, so this should be treated as a demo automation environment rather than persistent production data.

## Expected submission artifacts

After a successful execution:

```text
playwright-report/
reports/execution-report.pdf
screenshots/
test-results/
```

For the assessment, submit the repository or ZIP together with the generated PDF and README.

## Useful commands

```bash
npm install
npx playwright install chromium
npm test
npm run report
```
