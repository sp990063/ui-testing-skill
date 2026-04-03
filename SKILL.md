---
name: ui-testing
description: Comprehensive UI testing skill for Angular/React/Vue web applications using Playwright. Generates detailed test reports with screenshots.
whenToUse: When building, modifying, or verifying web UI features
---

# UI Testing Skill

A comprehensive skill for testing web UIs using Playwright. Produces detailed test reports with test cases and evidence screenshots.

## Core Principles

1. **Test BEFORE you claim done** - Never report completion without running tests
2. **Screenshot evidence** - Every test pass/fail gets visual proof
3. **Full workflow coverage** - Test complete user journeys, not just isolated components

## Prerequisites

Ensure these are installed in the project:
```bash
npm install -D @playwright/test playwright
npx playwright install chromium
```

## Project Setup

### 1. Playwright Config (`playwright.config.ts`)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  timeout: 30000,
});
```

### 2. Test File Structure

```
tests/
└── e2e/
    ├── pages/           # Page Object Models
    │   ├── HomePage.ts
    │   ├── CartPage.ts
    │   └── CheckoutPage.ts
    ├── specs/           # Test Specifications
    │   ├── smoke.spec.ts
    │   ├── cart.spec.ts
    │   └── checkout.spec.ts
    └── reports/         # Generated reports
```

## Test Case Design

### Standard Test Template

```typescript
import { test, expect, Page } from '@playwright/test';

// Test Case Template with Evidence Collection
const testCases = [
  {
    id: 'TC-001',
    title: 'User can add product to cart',
    steps: [
      'Navigate to home page',
      'Click "Add to Cart" button on first product',
      'Verify cart badge shows count of 1'
    ],
    expected: 'Cart badge displays "1"',
    severity: 'critical' // critical, major, minor
  },
];

for (const tc of testCases) {
  test(`${tc.id}: ${tc.title}`, async ({ page }) => {
    // Setup: Navigate
    await page.goto('http://localhost:4200');
    await page.waitForLoadState('networkidle');

    // Execute steps
    for (const step of tc.steps) {
      console.log(`Step: ${step}`);
    }

    // Assert
    await expect(page.locator('.cart-badge')).toHaveText('1');

    // Capture evidence
    await page.screenshot({ 
      path: `tests/e2e/reports/${tc.id}-pass.png`,
      fullPage: true 
    });
  });
}
```

## Report Generation

### Automated Test Report Script

Create `generate-report.ts`:

```typescript
import { promises as fs } from 'fs';
import path from 'path';

interface TestResult {
  id: string;
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

async function generateReport() {
  const resultsPath = path.join(__dirname, '../../test-results/results.json');
  const results = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));

  const report: string[] = [];
  report.push('# UI Test Report');
  report.push(`\nGenerated: ${new Date().toISOString()}\n`);
  
  // Summary
  const passed = results.stats.expected;
  const failed = results.stats.unexpected;
  const total = passed + failed;
  
  report.push('## Summary');
  report.push(`| Metric | Value |`);
  report.push(`|--------|-------|`);
  report.push(`| Total Tests | ${total} |`);
  report.push(`| Passed | ${passed} |`);
  report.push(`| Failed | ${failed} |`);
  report.push(`| Pass Rate | ${((passed/total)*100).toFixed(1)}% |`);
  report.push(`| Duration | ${(results.stats.duration/1000).toFixed(1)}s |`);
  
  // Test Cases Detail
  report.push('\n## Test Cases');
  
  for (const test of results.tests) {
    const status = test.ok ? '✅ PASS' : '❌ FAIL';
    report.push(`\n### ${test.title}`);
    report.push(`\n| Field | Value |`);
    report.push(`|-------|-------|`);
    report.push(`| Status | ${status} |`);
    report.push(`| Duration | ${(test.duration/1000).toFixed(1)}s |`);
    report.push(`| Error | ${test.errors?.[0]?.message || 'N/A' } |`);
    
    // Screenshot if failed
    if (!test.ok) {
      const screenshotPath = `tests/e2e/reports/${test.title.replace(/\s+/g, '-')}-fail.png`;
      report.push(`| Screenshot | ![Failure](${screenshotPath}) |`);
    }
  }
  
  await fs.writeFile('TEST-REPORT.md', report.join('\n'));
  console.log('Report generated: TEST-REPORT.md');
}

generateReport().catch(console.error);
```

## Angular-Specific Testing

### Critical UI Checks for Angular

```typescript
test('Angular component rendering', async ({ page }) => {
  await page.goto('http://localhost:4200');
  
  // Wait for Angular to bootstrap
  await page.waitForFunction(() => {
    return document.querySelector('app-root')?.innerHTML !== '';
  });
  
  // Verify products rendered
  const products = await page.locator('.product-card').count();
  expect(products).toBeGreaterThan(0);
  
  await page.screenshot({ 
    path: 'tests/e2e/reports/angular-render-pass.png',
    fullPage: true 
  });
});

test('Button click handler works', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await page.waitForLoadState('networkidle');
  
  // Click add to cart
  const addButton = page.locator('.product-card .btn-primary').first();
  await addButton.click();
  
  // CRITICAL: Verify click actually did something
  await expect(page.locator('.cart-badge')).toHaveText('1');
  
  await page.screenshot({ 
    path: 'tests/e2e/reports/button-handler-pass.png',
    fullPage: true 
  });
});

test('Form validation blocks submission', async ({ page }) => {
  await page.goto('http://localhost:4200/checkout');
  
  // Submit empty form - button should be disabled
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeDisabled();
  
  await page.screenshot({ 
    path: 'tests/e2e/reports/form-validation-pass.png',
    fullPage: true 
  });
});

test('Complete purchase flow', async ({ page }) => {
  // 1. Add item
  await page.goto('http://localhost:4200');
  await page.locator('.product-card .btn-primary').first().click();
  
  // 2. Go to cart
  await page.locator('.cart-link').click();
  await expect(page.locator('h1')).toContainText('Cart');
  
  // 3. Proceed to checkout
  await page.locator('.checkout-btn').click();
  
  // 4. Fill form
  await page.fill('input[name="fullName"]', 'John Doe');
  await page.fill('input[name="email"]', 'john@example.com');
  await page.fill('input[name="address1"]', '123 Main St');
  await page.fill('input[name="city"]', 'HK');
  await page.fill('input[name="postalCode"]', '12345');
  await page.fill('input[name="cardNumber"]', '1234567812345678');
  await page.fill('input[name="expiry"]', '12/28');
  await page.fill('input[name="cvv"]', '123');
  
  // 5. Submit
  await page.locator('button[type="submit"]').click();
  
  // 6. Verify confirmation
  await expect(page).toHaveURL(/\/order-confirmation/);
  await expect(page.locator('.order-id')).toBeVisible();
  
  await page.screenshot({ 
    path: 'tests/e2e/reports/purchase-flow-pass.png',
    fullPage: true 
  });
});
```

## Running Tests

### Standard Commands

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/cart.spec.ts

# Run with UI (headed mode)
npx playwright test --headed

# Run with debug
npx playwright test --debug

# Generate report
npx playwright show-report
```

### CI/CD Integration

```bash
# In CI pipeline
npm ci
npx playwright install --with-deps
npx playwright test --reporter=html,json
```

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Angular `app-root` is empty | Missing zone.js | Add `import 'zone.js'` to main.ts |
| Button click timeout | Handler not wired | Verify Angular binding syntax |
| Form stays enabled | Validation not working | Check form validators |
| Products not showing | Service not injected | Verify providers in appConfig |
| Navigation fails | Router not configured | Check app.routes.ts |

## Test Report Format

Final report should include:

```markdown
# UI Test Report - [Project Name]
Date: YYYY-MM-DD
Tester: [Agent Name]

## Executive Summary
- Total Tests: X
- Passed: X (X%)
- Failed: X
- Duration: Xs

## Test Results

| ID | Test Case | Status | Duration | Screenshot |
|----|-----------|--------|----------|------------|
| TC-001 | Add to Cart | ✅ PASS | 1.2s | [screenshot] |
| TC-002 | Checkout Flow | ✅ PASS | 3.5s | [screenshot] |
| TC-003 | Form Validation | ✅ PASS | 0.8s | [screenshot] |

## Defects Found

| ID | Severity | Description | Screenshot |
|----|----------|-------------|------------|
| DEF-001 | Critical | Button click does not add item to cart | [screenshot] |

## Sign-off

Tested by: AI Agent
Date: YYYY-MM-DD
Environment: [URL]
```

## Skill Usage

To use this skill:

1. **Before reporting UI completion**, invoke this skill
2. **Run the test suite** following the templates
3. **Generate the report** with screenshots
4. **Report any failures** as defects with evidence
5. **Fix and retest** until all tests pass

Remember: A UI feature is NOT complete until tests pass with visual evidence!
