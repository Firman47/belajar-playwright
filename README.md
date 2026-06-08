# E-Commerce Playwright Tests

## Project Structure

```
.
├── tests/              # Test specifications
│   ├── login.spec.ts   # Authentication tests
│   └── pages/          # Page Object Models
├── docs/               # Documentation
│   ├── AUTH_TEST_CASES.md      # Test case mapping
│   └── BUG_REPORT_TEMPLATE.md  # Bug report template
├── playwright.config.ts        # Playwright configuration
├── test-results/       # Test artifacts (auto-generated)
└── playwright-report/  # HTML Report (auto-generated)
```

## Run Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/login.spec.ts

# Run with UI mode (interactive)
npx playwright test --ui

# Run headed (see browser)
npx playwright test --headed

# Run specific project
npx playwright test --project=chromium
```

## Open HTML Report

```bash
# Open last report
npx playwright show-report

# Open specific report
npx playwright show-report playwright-report
```

## Locate Evidence (Playwright HTML Report)

The **HTML Report is the single source of truth** for all evidence. No separate markdown files needed.

| Evidence | How to Access |
|----------|---------------|
| **Screenshots** | Report → Test → **Screenshot** tab (captured on failure) |
| **Videos** | Report → Test → **Video** tab (recorded on failure) |
| **Traces** | Report → Test → **Trace** tab → click `.zip` to open in Trace Viewer |
| **Error Details** | Report → Test → **Errors** tab (stack trace, API responses) |
| **Test Steps** | Report → Test → **Steps** tab (test.step() actions) |

### Trace Viewer (Debugging)
```bash
npx playwright show-trace test-results/<trace-file>.zip
```

## Documentation

- [Test Cases](docs/AUTH_TEST_CASES.md) - Test ID mapping
- [Bug Report Template](docs/BUG_REPORT_TEMPLATE.md) - Simplified template (Bahasa Indonesia)

## Why Playwright HTML Report is Sufficient

1. **Built-in evidence**: Screenshots, videos, traces automatically attached to failed tests
2. **Interactive debugging**: Trace Viewer shows DOM, network, console, timeline
3. **No duplication**: Evidence lives in report, not scattered markdown files
4. **Developer-friendly**: Click test → see everything (steps, errors, artifacts)
5. **CI/CD ready**: HTML report published as artifact in pipelines
6. **Single source**: One report URL shares all context with team

## Configuration Highlights (playwright.config.ts)

- `screenshot: "only-on-failure"` - Capture on failure only
- `video: "retain-on-failure"` - Record video on failure
- `trace: "on-first-retry"` - Capture trace for debugging flaky tests
- Reporters: HTML (primary), JSON, JUnit