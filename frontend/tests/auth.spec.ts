import { test, expect } from './helpers/test-utils';

test.describe('Authentication Flows', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should display login form correctly', async ({ page }) => {
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.locator('input[name="email"]').fill('invalid-email');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Please enter a valid email')).toBeVisible();
    });

    test('should navigate to signup page', async ({ page }) => {
      await page.locator('text=Sign up').click();
      await expect(page).toHaveURL(/\/signup/);
    });

    test('should navigate to forgot password page', async ({ page }) => {
      await page.locator('text=Forgot password?').click();
      await expect(page).toHaveURL(/\/forgot-password/);
    });
  });

  test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
    });

    test('should display signup form correctly', async ({ page }) => {
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[name="firstName"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
      await page.locator('input[name="password"]').fill('weak');
      await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    });

    test('should successfully register a new user', async ({ page }) => {
      const uniqueEmail = `test.${Date.now()}@example.com`;
      
      await page.locator('input[name="firstName"]').fill('Test');
      await page.locator('input[name="lastName"]').fill('User');
      await page.locator('input[name="email"]').fill(uniqueEmail);
      await page.locator('input[name="password"]').fill('SecureP@ss123');
      await page.locator('input[name="confirmPassword"]').fill('SecureP@ss123');
      await page.locator('input[name="terms"]').check();
      
      await Promise.all([
        page.waitForURL('/dashboard'),
        page.locator('button[type="submit"]').click(),
      ]);
    });
  });

  test.describe('Password Reset', () => {
    test('should request password reset', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.locator('input[name="email"]').fill('user@example.com');
      
      await Promise.all([
        page.waitForResponse(/.*\/auth\/forgot-password.*/),
        page.locator('button[type="submit"]').click(),
      ]);
      
      await expect(page.locator('text=Check your email')).toBeVisible();
    });

    test('should reset password with valid token', async ({ page }) => {
      await page.goto('/reset-password?token=test-token');
      await page.locator('input[name="password"]').fill('NewSecureP@ss123');
      await page.locator('input[name="confirmPassword"]').fill('NewSecureP@ss123');
      
      await Promise.all([
        page.waitForURL('/login'),
        page.locator('button[type="submit"]').click(),
      ]);
    });
  });

  test.describe('Session Management', () => {
    test('should persist session after page reload', async ({ page, createAuthenticatedContext }) => {
      const context = await createAuthenticatedContext('user-123', 'test-jwt-token');
      const newPage = await context.newPage();
      
      await newPage.goto('/dashboard');
      await expect(newPage.locator('text=Dashboard')).toBeVisible();
      
      await newPage.reload();
      await expect(newPage.locator('text=Dashboard')).toBeVisible();
      
      await context.close();
    });

    test('should handle session expiration', async ({ page }) => {
      // Mock session expired response
      await page.route(/.*\/api\/user.*/, (route) => {
        route.fulfill({ status: 401, body: JSON.stringify({ error: 'Session expired' }) });
      });
      
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
