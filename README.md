# E-Commerce Playwright Tests

## Test Execution

### Run all tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test tests/login.spec.ts
```

### Run tests with UI mode (interactive)
```bash
npx playwright test --ui
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests for specific project
```bash
npx playwright test --project=chromium
```

## Generate & View Report

### Generate HTML report (auto-generated after test run)
```bash
npx playwright test --reporter=html
```

### Open last HTML report
```bash
npx playwright show-report
```

### Open specific report folder
```bash
npx playwright show-report playwright-report
```

## Test Artifacts Location

After test execution, find artifacts in:

| Artifact | Location | Description |
|----------|----------|-------------|
| **HTML Report** | `playwright-report/` | Interactive report with test results, screenshots, videos, traces |
| **Screenshots** | `test-results/` | Captured on failure (`.png`) |
| **Videos** | `test-results/` | Recorded on failure (`.webm`) |
| **Traces** | `test-results/` | Trace files for debugging (`.zip`) |
| **JSON Results** | `test-results/results.json` | Machine-readable test results |
| **JUnit XML** | `test-results/results.xml` | CI/CD integration format |

## Configuration

- **Reporter**: HTML, JSON, JUnit (see `playwright.config.ts`)
- **Screenshots**: Captured only on failure
- **Videos**: Retained only on failure
- **Traces**: Captured on first retry
- **Retries**: 2 on CI, 0 locally

## Test Structure

Tests use `test.step()` for clear action grouping:
- Navigate to page
- Perform action
- Verify result
- Capture evidence (on failure)

Test cases follow `[AUTH-XXX]` ID convention (see `AUTH_TEST_CASES.md`).