# Bug Report: AUTH-002 - Invalid Username Toast Shows Localization Key

## Bug Information

| Field | Details |
|-------|---------|
| **Bug ID** | BUG-20260608-002 |
| **Test Case ID** | [AUTH-002] Invalid username - API 401 dan UI toast muncul |
| **Title** | Login error toast displays localization key instead of API error message |
| **Environment** | Staging |
| **Module** | Authentication / Login |
| **Severity** | Medium |
| **Priority** | P2 |
| **Status** | New |
| **Assigned To** | Frontend Developer |
| **Reported By** | QA Engineer |
| **Reported Date** | 2026-06-08 |

---

## Description

### Steps to Reproduce
1. Navigate to login page (`/auth/login`)
2. Enter invalid username: `firmans` (valid username is `firman`)
3. Enter valid password: `password`
4. Click Login button
5. Observe error toast message

### Expected Result
Toast displays API error message: **"Invalid username or password"**

### Actual Result
Toast displays localization key: **"common.toast.auth.login_failed"**

---

## Technical Details

### API Response
```json
{
  "status": 401,
  "body": {
    "message": "Invalid username or password"
  }
}
```

### Environment Details
- **OS**: Windows 11
- **Browser**: Chrome 126.0.6478.127
- **Viewport**: 1280x720
- **Test User**: firmans (invalid) / password

---

## Evidence

### Screenshot
- **File**: `test-results/AUTH-002-evidence-login-toast.png`
- **Location in Report**: HTML Report → Authentication - Login → [AUTH-002] Invalid username → Screenshot tab
- **Captured At**: After toast appears, before assertion

### Video
- **File**: `test-results/AUTH-002-video.webm`
- **Location in Report**: HTML Report → Authentication - Login → [AUTH-002] Invalid username → Video tab
- **Duration**: Full test execution (page load → login → toast display)

### Trace
- **File**: `test-results/AUTH-002-trace.zip`
- **How to Open**: 
  ```bash
  npx playwright show-trace test-results/AUTH-002-trace.zip
  ```
- **Contains**: Network requests, DOM snapshots, console logs, timeline

### HTML Report
- **URL**: `playwright-report/index.html`
- **Test Path**: `Authentication - Login → [AUTH-002] Invalid username - API 401 dan UI toast muncul`
- **Direct Link**: `playwright-report/index.html?testId=auth-002`

---

## Root Cause Analysis (Preliminary)

The frontend toast component uses a hardcoded localization key `common.toast.auth.login_failed` instead of displaying the `message` field from the API response body.

**API Contract**: Returns `{ "message": "Invalid username or password" }`  
**UI Implementation**: Ignores `response.body.message`, shows static i18n key

---

## Additional Information

### Related Issues
- Similar issue may exist for AUTH-003 (Invalid password)
- Check all authentication error toasts

### Workaround
None - user sees unhelpful error message

---

## Verification Checklist

| Check | Status |
|-------|--------|
| Fix deployed to staging | ☐ |
| Test re-run passes (AUTH-002) | ☐ |
| Regression: AUTH-001 still passes | ☐ |
| Regression: AUTH-003 passes | ☐ |
| Regression: AUTH-004 passes | ☐ |
| Regression: AUTH-005 passes | ☐ |
| Evidence updated in report | ☐ |

**Verified By**: _______________  
**Verified Date**: _______________