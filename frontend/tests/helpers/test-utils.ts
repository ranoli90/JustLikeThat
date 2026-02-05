import { test as base, APIRequestContext, BrowserContext } from '@playwright/test';

interface TestUtils {
  /**
   * Create authenticated browser context for user flow testing
   */
  createAuthenticatedContext: (userId: string, token: string) => Promise<BrowserContext>;
  
  /**
   * Mock API responses for testing
   */
  mockApiResponse: (url: string, response: object, status?: number) => void;
  
  /**
   * Capture and analyze console messages
   */
  captureConsoleErrors: () => string[];
  
  /**
   * Network request/response interceptor
   */
  interceptRequests: () => { requests: Request[]; responses: Response[] };
  
  /**
   * Generate test data for job applications
   */
  generateJobApplicationData: () => object;
  
  /**
   * Wait for API call completion
   */
  waitForApiCall: (urlPattern: string) => Promise<Response>;
}

/**
 * Extended test fixture with intelligent testing utilities
 */
export const test = base.extend<TestUtils>({
  createAuthenticatedContext: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];
    
    const createContext = async (userId: string, token: string) => {
      const context = await browser.newContext({
        storageState: {
          cookies: [
            {
              name: 'auth_token',
              value: token,
              domain: 'localhost',
              path: '/',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'Lax',
              expires: Date.now() + 86400000, // 24 hours
            },
          ],
          origins: [],
        },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      });
      contexts.push(context);
      return context;
    };

    await use(createContext);

    // Cleanup
    for (const ctx of contexts) {
      await ctx.close();
    }
  },

  mockApiResponse: async ({ page }, use) => {
    const mocks: Map<string, { body: object; status: number }> = new Map();
    
    page.route(/api\./, (route) => {
      const url = route.request().url();
      const mock = mocks.get(url);
      
      if (mock) {
        route.fulfill({
          status: mock.status,
          body: JSON.stringify(mock.body),
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        route.continue();
      }
    });

    const mockResponse = (url: string, response: object, status = 200) => {
      mocks.set(url, { body: response, status });
    };

    await use(mockResponse);
  },

  captureConsoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`[${new Date().toISOString()}] Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', (err) => {
      errors.push(`[${new Date().toISOString()}] Page Error: ${err.message}`);
    });

    await use(() => errors);
  },

  interceptRequests: async ({ page }, use) => {
    const requests: Request[] = [];
    const responses: Response[] = [];

    page.on('request', (req) => requests.push(req));
    page.on('response', (res) => responses.push(res));

    await use(() => ({ requests, responses }));
  },

  generateJobApplicationData: async ({}, use) => {
    const generateData = () => ({
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: `john.doe.${Date.now()}@test.com`,
        phone: '+1-555-0100',
      },
      experience: {
        years: Math.floor(Math.random() * 15) + 1,
        level: ['junior', 'mid', 'senior', 'lead'][Math.floor(Math.random() * 4)],
        currentCompany: 'Test Corp',
        currentTitle: 'Software Engineer',
      },
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'].slice(0, Math.floor(Math.random() * 4) + 1),
      resumeUrl: 'https://example.com/resume.pdf',
      coverLetterUrl: 'https://example.com/cover.pdf',
    });

    await use(generateData);
  },

  waitForApiCall: async ({ page }, use) => {
    const waitForCall = async (urlPattern: string): Promise<Response> => {
      const response = await page.waitForResponse((res) => 
        res.url().match(urlPattern) !== null
      );
      return response;
    };

    await use(waitForCall);
  },
});

export { expect } from '@playwright/test';
