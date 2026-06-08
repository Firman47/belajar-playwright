# Bug Report Template

## Bug Information

| Field | Details |
|-------|---------|
| **Bug ID** | BUG-YYYYMMDD-XXX (e.g., BUG-20260608-001) |
| **Test Case ID** | [AUTH-XXX] |
| **Title** | Brief, descriptive title |
| **Environment** | Local / Staging / Production |
| **Module** | Authentication / Login / etc. |
| **Severity** | Critical / High / Medium / Low |
| **Priority** | P0 / P1 / P2 / P3 |
| **Status** | New / In Progress / Fixed / Verified / Closed |
| **Assigned To** | Developer name |
| **Reported By** | QA name |
| **Reported Date** | YYYY-MM-DD |

---

## Description

### Steps to Reproduce
1. Step one
2. Step two
3. Step three

### Expected Result
Describe what should happen.

### Actual Result
Describe what actually happens.

---

## Technical Details

### API Response
```json
{
  "status": 401,
  "body": {
    "message": "API error message"
  }
}
```

### Environment Details
- **OS**: Windows 10 / macOS / Linux
- **Browser**: Chrome 120 / Firefox / Safari
- **Viewport**: 1280x720
- **Test User**: username@example.com

---

## Evidence

### Screenshot
- **File**: `test-results/BUG-YYYYMMDD-XXX-screenshot.png`
- **Location in Report**: HTML Report → Test → Screenshot tab

### Video
- **File**: `test-results/BUG-YYYYMMDD-XXX-video.webm`
- **Location in Report**: HTML Report → Test → Video tab

### Trace
- **File**: `test-results/BUG-YYYYMMDD-XXX-trace.zip`
- **How to Open**: `npx playwright show-trace test-results/BUG-YYYYMMDD-XXX-trace.zip`

### HTML Report
- **URL**: `playwright-report/index.html`
- **Test Path**: `Authentication - Login → [AUTH-XXX] Test Name`

---

## Additional Information

### Related Issues
- Link to related tickets

### Root Cause (if known)
Analysis of why the bug occurs

### Workaround (if any)
Temporary solution for users

---

## Verification

| Check | Status |
|-------|--------|
| Fix deployed to environment | ☐ |
| Test re-run passes | ☐ |
| Regression test passes | ☐ |
| Evidence updated | ☐ |

**Verified By**: _______________  
**Verified Date**: _______________