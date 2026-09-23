import fs from 'node:fs';
import path from 'node:path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult
} from '@playwright/test/reporter';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

type Row = {
  title: string;
  status: string;
  durationMs: number;
  errors: string[];
};

export default class PdfReporter implements Reporter {
  private rows: Row[] = [];
  private startedAt = new Date();

  onTestEnd(test: TestCase, result: TestResult) {
    this.rows.push({
      title: test.titlePath().join(' > '),
      status: result.status,
      durationMs: result.duration,
      errors: result.errors.map(e => e.message || 'Unknown error')
    });
  }

  async onEnd(result: FullResult) {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let page = pdf.addPage([595, 842]);
    let y = 790;

    // pdf-lib StandardFonts.Helvetica uses WinAnsi. Keep report text within
    // a safe ASCII subset and strip ANSI terminal escape sequences.
    const sanitize = (value: string) => value
      .replace(/\x1B(?:\[[0-?]*[ -\/]*[@-~]|\][^\x07]*(?:\x07|\x1B\\))/g, '')
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      .replace(/[^\x20-\x7E]/g, '?')
      .replace(/\s+/g, ' ')
      .trim();

    const draw = (text: string, size = 10, isBold = false) => {
      text = sanitize(text);
      if (y < 55) {
        page = pdf.addPage([595, 842]);
        y = 790;
      }
      page.drawText(text.slice(0, 110), {
        x: 42,
        y,
        size,
        font: isBold ? bold : font,
        color: rgb(0.12, 0.12, 0.12)
      });
      y -= size + 8;
    };

    draw('PLAYWRIGHT AUTOMATION EXECUTION REPORT', 18, true);
    draw('Atomic CRM Demo', 13, true);
    draw(`Execution started: ${this.startedAt.toISOString()}`);
    draw(`Overall status: ${result.status.toUpperCase()}`);
    y -= 10;

    const passed = this.rows.filter(r => r.status === 'passed').length;
    const failed = this.rows.filter(r => r.status === 'failed').length;
    const skipped = this.rows.filter(r => ['skipped', 'interrupted'].includes(r.status)).length;

    draw('TEST SUMMARY', 12, true);
    draw(`Total: ${this.rows.length}`);
    draw(`Passed: ${passed}`);
    draw(`Failed: ${failed}`);
    draw(`Skipped/Interrupted: ${skipped}`);
    y -= 10;

    draw('TEST CASES', 12, true);
    for (const row of this.rows) {
      draw(`${row.status.toUpperCase()} | ${row.title}`, 10, true);
      draw(`Duration: ${(row.durationMs / 1000).toFixed(2)} seconds`);
      for (const error of row.errors.slice(0, 3)) {
        draw(`Error: ${error.replace(/\s+/g, ' ')}`, 9);
      }
      y -= 4;
    }

    y -= 10;
    draw('FRAMEWORK', 12, true);
    draw('Playwright Test + TypeScript + Page Object Model');
    draw('Dynamic test data is generated per execution.');
    draw('Screenshots, trace and video are enabled for failure diagnostics.');
    draw('Credentials are supplied through environment variables.');
    draw('AI/MCP is documented as an optional engineering enhancement.');

    const outputDir = path.resolve('reports');
    fs.mkdirSync(outputDir, { recursive: true });
    const output = path.join(outputDir, 'execution-report.pdf');
    fs.writeFileSync(output, await pdf.save());

    console.log(`PDF report written to ${output}`);
  }
}
