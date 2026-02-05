import { test, expect } from '@playwright/test';

/**
 * Simple smoke test to verify Playwright is working correctly
 */
test.describe('Smoke Tests', () => {
  test('should load login page and verify basic structure', async ({ page }) => {
    // Navigate to a simple page (we'll use about:blank as a smoke test)
    await page.goto('about:blank');
    
    // Verify page loaded
    await expect(page).toHaveTitle(/.*/);
    
    // Verify page context exists
    const body = await page.locator('body').isVisible();
    expect(body).toBe(true);
  });

  test('should verify Playwright test fixtures are working', async ({ page }) => {
    // Set content manually for testing
    await page.setContent(`
      <html>
        <head><title>Smoke Test</title></head>
        <body>
          <h1>SimpleAsThat</h1>
          <form>
            <input type="email" name="email" required />
            <input type="password" name="password" required />
            <button type="submit">Login</button>
          </form>
        </body>
      </html>
    `);
    
    // Verify form elements exist
    await expect(page.locator('h1')).toHaveText('SimpleAsThat');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should handle form interactions', async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <form>
            <input type="text" id="name" />
            <input type="email" id="email" />
            <button type="submit" id="submit">Submit</button>
            <p id="output"></p>
          </form>
        </body>
      </html>
    `);
    
    // Fill form
    await page.locator('#name').fill('Test User');
    await page.locator('#email').fill('test@example.com');
    
    // Verify values
    await expect(page.locator('#name')).toHaveValue('Test User');
    await expect(page.locator('#email')).toHaveValue('test@example.com');
  });

  test('should handle async operations', async ({ page }) => {
    await page.setContent('<div id="result"></div>');
    
    // Simulate async operation
    await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          document.getElementById('result')!.textContent = 'Async Complete';
          resolve(true);
        }, 100);
      });
    });
    
    await expect(page.locator('#result')).toHaveText('Async Complete');
  });

  test('should handle errors gracefully', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });
    
    await page.setContent('<button id="error">Error</button>');
    
    // Clicking should not throw
    await page.locator('#error').click();
    
    // No errors should be captured
    expect(errors.length).toBe(0);
  });
});

/**
 * Performance baseline test
 */
test.describe('Performance Baselines', () => {
  test('should measure page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('about:blank');
    
    const loadTime = Date.now() - startTime;
    
    // Should load almost instantly
    expect(loadTime).toBeLessThan(1000);
  });

  test('should measure DOM operations performance', async ({ page }) => {
    await page.setContent('<div id="container"></div>');
    
    const startTime = Date.now();
    
    // Create 100 elements
    await page.evaluate(() => {
      const container = document.getElementById('container')!;
      for (let i = 0; i < 100; i++) {
        const div = document.createElement('div');
        div.textContent = `Item ${i}`;
        container.appendChild(div);
      }
    });
    
    const operationTime = Date.now() - startTime;
    
    // Should complete quickly
    expect(operationTime).toBeLessThan(2000);
  });
});

/**
 * Memory baseline test
 */
test.describe('Memory Baselines', () => {
  test('should handle memory operations', async ({ page }) => {
    const initialSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });
    
    // Create and remove elements
    await page.evaluate(() => {
      const container = document.createElement('div');
      for (let i = 0; i < 50; i++) {
        container.appendChild(document.createElement('div'));
      }
      document.body.appendChild(container);
      document.body.removeChild(container);
    });
    
    const finalSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });
    
    // Should be back to baseline (allowing for some overhead)
    expect(finalSize).toBeLessThanOrEqual(initialSize + 10);
  });
});
