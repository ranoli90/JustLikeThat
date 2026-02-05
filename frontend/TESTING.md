# Playwright Testing Guide

This document describes the intelligent testing setup for the SimpleAsThat web application.

## Quick Start

```bash
cd frontend
npm install
npx playwright install
npm run test
```

## Available Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests with HTML reporter |
| `npm run test:headed` | Run tests in headed mode (see browser) |
| `npm run test:ui` | Open Playwright UI for interactive testing |
| `npm run test:debug` | Run tests in debug mode |
| `npm run test:auth` | Run authentication tests only |
| `npm run test:jobs` | Run job application tests only |
| `npm run test:api` | Run API integration tests only |
| `npm run test:a11y` | Run accessibility tests only |
| `npm run test:smoke` | Quick smoke test with Chromium |
| `npm run test:full` | Full test suite with HTML report |

## Test Suite Overview

### 1. Authentication Tests (`tests/auth.spec.ts`)
- Login form validation
- Signup flow
- Password reset
- Session management
- Token expiration handling

### 2. Job Application Tests (`tests/job-application.spec.ts`)
- Job search functionality
- Job details page
- Multi-step application form
- File uploads
- Application status tracking

### 3. API Integration Tests (`tests/api-integration.spec.ts`)
- Auth API endpoints
- Jobs API CRUD
- Applications API
- User profile API
- Error handling and rate limiting

### 4. Accessibility Tests (`tests/accessibility.spec.ts`)
- Keyboard navigation
- ARIA attributes
- Screen reader compatibility
- Color contrast
- Form accessibility
- Performance metrics

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
TEST_API_TOKEN=test-token
E2E_USERNAME=user
E2E_PASSWORD=password
```

### Playwright Config (`playwright.config.ts`)

The configuration supports:
- Multiple browsers (Chromium, Firefox, WebKit)
- Mobile emulation (Pixel 5, iPhone 12)
- Automatic web server startup
- HTML/JSON/Line reporters
- Screenshot and video capture on failure
- Retry mechanisms

## Advanced Debugging

### Using Debug Utilities

```typescript
import { createDebugUtils } from './tests/helpers/debug-utils';

test('my test', async ({ page, context }) => {
  const debug = createDebugUtils(page, context, { verbose: true });
  
  // Monitor JS errors
  const errors = debug.monitorJsErrors();
  
  // Measure performance
  const fcp = await debug.measureFCP();
  const lcp = await debug.measureLCP();
  
  // Detect memory leaks
  const memoryReport = await debug.detectMemoryLeaks();
  
  // Generate test report
  const report = await debug.generateTestReport('my-test');
});
```

### Debug Utilities Features

1. **Console Capture**: All console messages with timestamps and locations
2. **Network Analysis**: Request/response tracking with performance metrics
3. **Memory Leak Detection**: JS heap size monitoring
4. **Visual Snapshots**: Full-page screenshots for comparison
5. **Performance Metrics**: FCP, LCP, load times
6. **Component Interactivity**: Testing individual component states

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:smoke
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## Test Data Generation

The test utilities include data generators for:

- Job applications with random data
- User profiles
- Authentication tokens
- API responses

## Best Practices

1. **Use Test Fixtures**: Leverage `test-utils.ts` for common setup
2. **Mock APIs**: Use `mockApiResponse` for deterministic tests
3. **Capture Errors**: Use `captureConsoleErrors` for debugging
4. **Wait Properly**: Use `waitForApiCall` for async operations
5. **Test Mobile**: Run tests on mobile viewport sizes
6. **Accessibility First**: Include a11y tests in every feature

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase `actionTimeout` and `navigationTimeout` in config
   - Check for infinite loops in application code

2. **Element not found**
   - Use `waitForSelector` before interacting
   - Check for dynamic content loading

3. **Flaky tests**
   - Add retries in config
   - Use `waitForLoadState('networkidle')`

### Debug Mode

Run tests with debug mode for step-by-step execution:

```bash
npm run test:debug
```

This opens the Playwright inspector for interactive debugging.
