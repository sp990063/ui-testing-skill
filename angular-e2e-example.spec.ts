/**
 * UI Testing Skill - Angular E2E Test Example
 * 
 * This demonstrates the standard test patterns for Angular apps.
 * Use this as a template for new test files.
 * 
 * Run: npx playwright test tests/e2e/angular-example.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================
// TEST CASE REGISTRY
// Update this array when adding new tests
// ============================================================
const TEST_CASES = [
  { id: 'TC-001', name: 'Homepage loads with product catalog' },
  { id: 'TC-002', name: 'User can add product to cart' },
  { id: 'TC-003', name: 'Cart displays added items correctly' },
  { id: 'TC-004', name: 'User can update item quantity' },
  { id: 'TC-005', name: 'User can remove item from cart' },
  { id: 'TC-006', name: 'Cart badge updates correctly' },
  { id: 'TC-007', name: 'Empty cart shows empty state' },
  { id: 'TC-008', name: 'Checkout form validation works' },
  { id: 'TC-009', name: 'Complete purchase flow succeeds' },
  { id: 'TC-010', name: 'Order confirmation displays order ID' },
];

// ============================================================
// HELPER: Capture test evidence
// ============================================================
async function captureEvidence(page: Page, testId: string, status: 'pass' | 'fail') {
  const filename = `tests/e2e/reports/${testId}-${status}.png`;
  await page.screenshot({ 
    path: filename, 
    fullPage: true 
  });
  return filename;
}

// ============================================================
// TEST SUITE: Online Store E2E Tests
// ============================================================

test.describe('Online Store E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
  });

  // ----------------------------------------------------------
  // TC-001: Homepage loads with product catalog
  // ----------------------------------------------------------
  test('TC-001: Homepage loads with product catalog', async ({ page }) => {
    try {
      // Wait for Angular to bootstrap
      await page.waitForFunction(() => {
        const appRoot = document.querySelector('app-root');
        return appRoot && appRoot.innerHTML.trim() !== '';
      }, { timeout: 10000 });

      // Verify hero section
      await expect(page.locator('h1')).toContainText('Welcome');

      // Verify products are displayed
      const productCards = page.locator('.product-card');
      const count = await productCards.count();
      expect(count).toBeGreaterThan(0);

      // Capture evidence
      await captureEvidence(page, 'TC-001', 'pass');
      
      console.log(`✅ TC-001 PASSED: Found ${count} products`);
    } catch (error) {
      await captureEvidence(page, 'TC-001', 'fail');
      throw error;
    }
  });

  // ----------------------------------------------------------
  // TC-002: User can add product to cart
  // ----------------------------------------------------------
  test('TC-002: User can add product to cart', async ({ page }) => {
    try {
      const addButton = page.locator('.product-card .btn-primary').first();
      
      // Verify button is visible and enabled
      await expect(addButton).toBeVisible();
      await expect(addButton).toBeEnabled();

      // Click add to cart
      await addButton.click();

      // CRITICAL: Verify cart badge updated
      await expect(page.locator('.cart-badge')).toHaveText('1');

      // Capture evidence
      await captureEvidence(page, 'TC-002', 'pass');
      
      console.log('✅ TC-002 PASSED: Product added to cart');
    } catch (error) {
      await captureEvidence(page, 'TC-002', 'fail');
      throw error;
    }
  });

  // ----------------------------------------------------------
  // TC-003: Cart displays added items correctly
  // ----------------------------------------------------------
  test('TC-003: Cart displays added items correctly', async ({ page }) => {
    try {
      // Add item first
      await page.locator('.product-card .btn-primary').first().click();
      
      // Navigate to cart
      await page.locator('.cart-link').click();
      
      // Verify cart page
      await expect(page.locator('h1')).toContainText('Cart');
      
      // Verify item is displayed
      const cartItems = page.locator('.cart-item');
      await expect(cartItems).toHaveCount(1);

      // Verify item details shown
      await expect(page.locator('.item-details h3')).toBeVisible();

      await captureEvidence(page, 'TC-003', 'pass');
      console.log('✅ TC-003 PASSED: Cart displays items correctly');
    } catch (error) {
      await captureEvidence(page, 'TC-003', 'fail');
      throw error;
    }
  });

  // ----------------------------------------------------------
  // TC-004: User can update item quantity
  // ----------------------------------------------------------
  test('TC-004: User can update item quantity', async ({ page }) => {
    try {
      // Add item and go to cart
      await page.locator('.product-card .btn-primary').first().click();
      await page.locator('.cart-link').click();

      // Get initial quantity
      const qtyBefore = await page.locator('.qty-value').textContent();
      expect(qtyBefore).toBe('1');

      // Increase quantity (click the + button)
      await page.locator('.cart-item .btn-secondary').last().click();
      
      // Verify quantity updated
      await expect(page.locator('.qty-value')).toHaveText('2');

      // Verify total updated
      await expect(page.locator('.summary-row.total')).toContainText('$');

      await captureEvidence(page, 'TC-004', 'pass');
      console.log('✅ TC-004 PASSED: Quantity updated successfully');
    } catch (error) {
      await captureEvidence(page, 'TC-004', 'fail');
      throw error;
    }
  });

  // ----------------------------------------------------------
  // TC-005: User can remove item from cart
  // ----------------------------------------------------------
  test('TC-005: User can remove item from cart', async ({ page }) => {
    try {
      // Add item and go to cart
      await page.locator('.product-card .btn-primary').first().click();
      await page.locator('.cart-link').click();

      // Remove item
      await page.locator('.cart-item .btn-danger').click();

      // Verify empty state
      await expect(page.locator('.empty-cart')).toBeVisible();
      await expect(page.locator('.empty-cart h2')).toContainText('empty');

      await captureEvidence(page, 'TC-005', 'pass');
      console.log('✅ TC-005 PASSED: Item removed successfully');
    } catch (error) {
      await captureEvidence(page, 'TC-005', 'fail');
      throw error;
    }
  });

  // ----------------------------------------------------------
  // TC-006: Cart badge updates correctly
  // ----------------------------------------------------------
  test('TC-006: Cart badge updates correctly', async ({ page }) => {
    try {
      // Initially should be empty
      const badgeExistsInitially = await page.locator('.cart-badge').isVisible();
      
      // Add first item
      await page.locator('.product-card .btn-primary').first().click();
      await expect(page.locator('.cart-badge')).toHaveText('1');

      // Add second item
      await page.locator('.product-card .btn-primary').first().click();
      await expect(page.locator('.cart-badge')).toHaveText('2');

      await captureEvidence(page, 'TC-006', 'pass');
      console.log('✅ TC-006 PASSED: Cart badge updates correctly');
    } catch (error) {
      await captureEvidence(page, 'TC-006', 'fail');
      throw error;
    }
  });

  // ----------------------------------------------------------
  // TC-007: Empty cart shows empty state
  // ----------------------------------------------------------
  test('TC-007: Empty cart shows empty state', async ({ page }) => {
    try {
      await page.locator('.cart-link').click();
      
      // Should show empty state
      await expect(page.locator('.empty-cart')).toBeVisible();
      await expect(page.locator('.empty-cart h2')).toContainText('empty');
      await expect(page.locator('.empty-cart a')).toContainText('Continue');

      await captureEvidence(page, 'TC-007', 'pass');
      console.log('✅ TC-007 PASSED: Empty cart shows empty state');
    } catch (error) {
      await captureEvidence(page, 'TC-007', 'fail');
      throw error;
    }
  });

  // ----------------------------------------------------------
  // TC-008: Checkout form validation works
  // ----------------------------------------------------------
  test('TC-008: Checkout form validation works', async ({ page }) => {
    try {
      // Add item and go to checkout
      await page.locator('.product-card .btn-primary').first().click();
      await page.locator('.cart-link').click();
      await page.locator('.checkout-btn').click();

      // Button should be disabled when form is empty
      await expect(page.locator('button[type="submit"]')).toBeDisabled();

      // Fill partial form
      await page.fill('input[name="fullName"]', 'John');
      await page.fill('input[name="email"]', 'bad-email');

      // Should still be disabled (email invalid)
      await expect(page.locator('button[type="submit"]')).toBeDisabled();

      await captureEvidence(page, 'TC-008', 'pass');
      console.log('✅ TC-008 PASSED: Form validation works correctly');
    } catch (error) {
      await captureEvidence(page, 'TC-008', 'fail');
      throw error;
    }
  });

  // ----------------------------------------------------------
  // TC-009: Complete purchase flow succeeds
  // ----------------------------------------------------------
  test('TC-009: Complete purchase flow succeeds', async ({ page }) => {
    try {
      // 1. Add item
      await page.locator('.product-card .btn-primary').first().click();

      // 2. Go to cart
      await page.locator('.cart-link').click();

      // 3. Proceed to checkout
      await page.locator('.checkout-btn').click();

      // 4. Fill complete form
      await page.fill('input[name="fullName"]', 'John Doe');
      await page.fill('input[name="email"]', 'john@example.com');
      await page.fill('input[name="address1"]', '123 Main Street');
      await page.fill('input[name="city"]', 'Hong Kong');
      await page.fill('input[name="postalCode"]', '12345');
      await page.fill('input[name="cardNumber"]', '1234567812345678');
      await page.fill('input[name="expiry"]', '12/28');
      await page.fill('input[name="cvv"]', '123');

      // 5. Submit
      await page.locator('button[type="submit"]').click();

      // 6. Verify redirect to confirmation
      await expect(page).toHaveURL(/\/order-confirmation/);

      await captureEvidence(page, 'TC-009', 'pass');
      console.log('✅ TC-009 PASSED: Complete purchase flow succeeded');
    } catch (error) {
      await captureEvidence(page, 'TC-009', 'fail');
      throw error;
    }
  });

  // ----------------------------------------------------------
  // TC-010: Order confirmation displays order ID
  // ----------------------------------------------------------
  test('TC-010: Order confirmation displays order ID', async ({ page }) => {
    try {
      // Complete purchase first
      await page.locator('.product-card .btn-primary').first().click();
      await page.locator('.cart-link').click();
      await page.locator('.checkout-btn').click();
      
      await page.fill('input[name="fullName"]', 'Jane Smith');
      await page.fill('input[name="email"]', 'jane@example.com');
      await page.fill('input[name="address1"]', '456 Oak Ave');
      await page.fill('input[name="city"]', 'Kowloon');
      await page.fill('input[name="postalCode"]', '67890');
      await page.fill('input[name="cardNumber"]', '9876543210987654');
      await page.fill('input[name="expiry"]', '06/29');
      await page.fill('input[name="cvv"]', '456');
      await page.locator('button[type="submit"]').click();

      // Verify confirmation page
      await expect(page.locator('h1')).toContainText('Thank you');
      await expect(page.locator('.order-id')).toBeVisible();
      
      // Verify order ID format
      const orderId = await page.locator('.order-id').textContent();
      expect(orderId).toMatch(/ORD-[A-Z0-9]+/);

      await captureEvidence(page, 'TC-010', 'pass');
      console.log(`✅ TC-010 PASSED: Order ID displayed: ${orderId}`);
    } catch (error) {
      await captureEvidence(page, 'TC-010', 'fail');
      throw error;
    }
  });
});

// ============================================================
// SMOKE TEST (Quick sanity check)
// ============================================================
test.describe('Smoke Tests', () => {
  test('Homepage is accessible', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await expect(page).toHaveTitle(/Online/i);
    await page.screenshot({ path: 'tests/e2e/reports/smoke-homepage.png' });
  });
});
