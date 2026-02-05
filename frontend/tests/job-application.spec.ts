import { test, expect } from './helpers/test-utils';

test.describe('Job Application Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and essential API calls
    await page.route(/.*\/api\/user.*/, (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'candidate',
        }),
      });
    });
  });

  test.describe('Job Search', () => {
    test('should display job search page correctly', async ({ page }) => {
      await page.goto('/jobs');
      
      await expect(page.locator('input[name="search"]')).toBeVisible();
      await expect(page.locator('select[name="location"]')).toBeVisible();
      await expect(page.locator('select[name="type"]')).toBeVisible();
    });

    test('should search jobs with keyword', async ({ page }) => {
      await page.goto('/jobs');
      
      // Mock job search API
      await page.route(/.*\/api\/jobs.*/, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            jobs: [
              {
                id: 'job-1',
                title: 'Senior Software Engineer',
                company: 'Tech Corp',
                location: 'San Francisco, CA',
                type: 'Full-time',
                salary: '$150k - $200k',
                posted: '2 days ago',
              },
            ],
            total: 1,
          }),
        });
      });

      await page.locator('input[name="search"]').fill('software engineer');
      await page.locator('button[type="submit"]').click();
      
      await expect(page.locator('text=Senior Software Engineer')).toBeVisible();
    });

    test('should filter jobs by location', async ({ page }) => {
      await page.goto('/jobs');
      
      await page.locator('select[name="location"]').selectOption('San Francisco, CA');
      await page.locator('button[type="submit"]').click();
      
      await expect(page.locator('text=San Francisco, CA')).toBeVisible();
    });
  });

  test.describe('Job Details', () => {
    test('should display job details correctly', async ({ page }) => {
      await page.goto('/jobs/job-1');
      
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Apply Now')).toBeVisible();
      await expect(page.locator('text=Company')).toBeVisible();
    });

    test('should navigate to application from job details', async ({ page }) => {
      await page.goto('/jobs/job-1');
      
      await Promise.all([
        page.waitForURL(/\/apply/),
        page.locator('text=Apply Now').click(),
      ]);
    });
  });

  test.describe('Application Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/apply/job-1');
    });

    test('should display all application steps', async ({ page }) => {
      await expect(page.locator('text=Personal Information')).toBeVisible();
      await expect(page.locator('text=Experience')).toBeVisible();
      await expect(page.locator('text=Documents')).toBeVisible();
      await expect(page.locator('text=Review')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=First name is required')).toBeVisible();
      await expect(page.locator('text=Email is required')).toBeVisible();
    });

    test('should complete personal information step', async ({ page }) => {
      const firstName = `Test${Date.now()}`;
      const lastName = 'User';
      const email = `test.${Date.now()}@example.com`;
      const phone = '+1-555-0100';
      
      await page.locator('input[name="firstName"]').fill(firstName);
      await page.locator('input[name="lastName"]').fill(lastName);
      await page.locator('input[name="email"]').fill(email);
      await page.locator('input[name="phone"]').fill(phone);
      
      await page.locator('button:has-text("Next")').click();
      await expect(page.locator('text=Experience')).toBeVisible();
    });

    test('should complete experience step', async ({ page }) => {
      await page.locator('input[name="yearsOfExperience"]').fill('5');
      await page.locator('select[name="level"]').selectOption('senior');
      await page.locator('input[name="currentCompany"]').fill('Test Corp');
      
      await page.locator('button:has-text("Next")').click();
      await expect(page.locator('text=Documents')).toBeVisible();
    });

    test('should handle file upload', async ({ page }) => {
      // Mock successful file upload
      await page.route(/.*\/api\/upload.*/, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ url: 'https://example.com/resume.pdf' }),
        });
      });
      
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.locator('input[type="file"]').setInputFiles({
        name: 'resume.pdf',
        mimeType: 'application/pdf',
      } as any);
      
      await expect(page.locator('text=resume.pdf')).toBeVisible();
    });

    test('should submit complete application', async ({ page }) => {
      // Fill personal info
      await page.locator('input[name="firstName"]').fill('John');
      await page.locator('input[name="lastName"]').fill('Doe');
      await page.locator('input[name="email"]').fill('john.doe@example.com');
      await page.locator('input[name="phone"]').fill('+1-555-0100');
      await page.locator('button:has-text("Next")').click();
      
      // Fill experience
      await page.locator('input[name="yearsOfExperience"]').fill('5');
      await page.locator('select[name="level"]').selectOption('senior');
      await page.locator('button:has-text("Next")').click();
      
      // Skip documents for now
      await page.locator('button:has-text("Next")').click();
      
      // Review and submit
      await expect(page.locator('text=Review Your Application')).toBeVisible();
      
      await Promise.all([
        page.waitForResponse(/.*\/api\/applications.*/),
        page.locator('button:has-text("Submit Application")').click(),
      ]);
      
      await expect(page.locator('text=Application Submitted!')).toBeVisible();
    });
  });

  test.describe('Application Status', () => {
    test('should display application status', async ({ page }) => {
      // Mock applications API
      await page.route(/.*\/api\/applications.*/, (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            applications: [
              {
                id: 'app-1',
                jobTitle: 'Software Engineer',
                company: 'Tech Corp',
                status: 'in_review',
                appliedDate: '2024-01-15',
              },
            ],
          }),
        });
      });
      
      await page.goto('/applications');
      
      await expect(page.locator('text=Software Engineer')).toBeVisible();
      await expect(page.locator('text=In Review')).toBeVisible();
    });
  });
});
