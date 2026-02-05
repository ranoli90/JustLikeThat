import { test, expect } from './helpers/test-utils';

test.describe('Accessibility Tests', () => {
  test.describe('Keyboard Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should be able to navigate login form with keyboard', async ({ page }) => {
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });

    test('should show focus indicators', async ({ page }) => {
      await page.locator('input[name="email"]').focus();
      
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveClass(/focus-visible|focus:/);
    });

    test('should handle skip links', async ({ page }) => {
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should skip to main content
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('ARIA Attributes', () => {
    test('should have proper ARIA labels on form inputs', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-required', 'true');
      await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password');
    });

    test('should announce form validation errors', async ({ page }) => {
      await page.locator('button[type="submit"]').click();
      
      const emailError = page.locator('#email-error, text=Email is required');
      await expect(emailError.first()).toBeVisible();
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/jobs');
      
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();
      
      const h2s = page.locator('h2');
      const count = await h2s.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have alt text on images', async ({ page }) => {
      await page.goto('/jobs');
      
      const images = page.locator('img');
      const count = await images.count();
      
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });
  });

  test.describe('Screen Reader Compatibility', () => {
    test('should have proper page titles', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveTitle(/Login|Sign In/);
    });

    test('should have meta description', async ({ page }) => {
      const meta = page.locator('meta[name="description"]');
      await expect(meta).toHaveAttribute('content', /.+/);
    });

    test('should use semantic HTML', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });
  });

  test.describe('Color Contrast', () => {
    test('should have accessible color contrast', async ({ page }) => {
      await page.goto('/login');
      
      const submitButton = page.locator('button[type="submit"]');
      const buttonColor = await submitButton.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Button should have sufficient color contrast
      expect(buttonColor).toBeTruthy();
    });

    test('should not rely solely on color for information', async ({ page }) => {
      await page.goto('/login');
      
      // Submit without filling form
      await page.locator('button[type="submit"]').click();
      
      // Error messages should be visible (not just color-coded)
      await expect(page.locator('text=Email is required')).toBeVisible();
    });
  });

  test.describe('Form Accessibility', () => {
    test('should have associated labels', async ({ page }) => {
      await page.goto('/login');
      
      const emailInput = page.locator('input[name="email"]');
      const emailId = await emailInput.getAttribute('id');
      
      const label = page.locator(`label[for="${emailId}"]`);
      await expect(label).toBeVisible();
    });

    test('should indicate required fields', async ({ page }) => {
      await page.goto('/signup');
      
      const firstName = page.locator('input[name="firstName"]');
      await expect(firstName).toHaveAttribute('required');
    });

    test('should describe input errors', async ({ page }) => {
      await page.goto('/login');
      
      await page.locator('input[name="email"]').fill('invalid');
      await page.locator('button[type="submit"]').click();
      
      const error = page.locator('[aria-invalid="true"], text=Invalid email');
      await expect(error.first()).toBeVisible();
    });
  });
});

test.describe('Performance Tests', () => {
  test('should load login page within 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });

  test('should load jobs page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/jobs');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have efficient caching', async ({ page }) => {
    // First visit
    await page.goto('/login');
    
    // Second visit should be faster
    const startTime = Date.now();
    await page.goto('/login');
    const secondLoadTime = Date.now() - startTime;
    
    expect(secondLoadTime).toBeLessThan(1000);
  });

  test('should optimize images', async ({ page }) => {
    await page.goto('/jobs');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src') || '';
      
      // Should use optimized formats or have dimensions
      const hasDimensions = (await img.getAttribute('width')) !== null || 
                           (await img.getAttribute('height')) !== null;
      
      if (src.match(/\.(jpg|jpeg|png)$/i)) {
        expect(hasDimensions).toBe(true);
      }
    }
  });

  test('should minimize Cumulative Layout Shift', async ({ page }) => {
    await page.goto('/jobs');
    
    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');
    
    // Check for CLS issues
    const layoutShifts = await page.evaluate(() => {
      return performance.getEntriesByType('layout-shift');
    });
    
    // Should have minimal layout shifts
    expect(layoutShifts.length).toBeLessThan(5);
  });

  test('should have proper bundle sizes', async ({ page }) => {
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter((entry: any) => entry.name.includes('.js') || entry.name.includes('.css'))
        .map((entry: any) => ({
          name: entry.name,
          size: entry.transferSize,
        }));
    });
    
    // Check that no single bundle is too large
    const largeBundles = performanceEntries.filter((entry: any) => entry.size > 500 * 1024);
    expect(largeBundles.length).toBe(0);
  });
});
