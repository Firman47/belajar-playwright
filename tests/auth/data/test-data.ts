/**
 * Shared test data for Auth module (Login, Register, Forgot Password).
 *
 * Centralized location for all hardcoded strings used across auth tests.
 * Source: docs/API_DOCUMENTATION.md, docs/testcases/AUTH_TEST_CASES.md,
 *         docs/testcases/REGISTER_TEST_CASES.md
 */

// ====================================================================
// Login Module
// ====================================================================

export const LOGIN = {
  /** Mock user credentials (pre-registered in mock server) */
  VALID_USERNAME: "firman" as const,
  VALID_PASSWORD: "password" as const,

  /** Error credentials for negative tests */
  WRONG_PASSWORD: "wrongpassword" as const,
  NONEXISTENT_USERNAME: "nonexistent_user_12345" as const,

  /** API response messages (from API_DOCUMENTATION.md) */
  MESSAGES: {
    SUCCESS: "Login successful",
    INVALID_CREDENTIALS: "Invalid username or password",
    MISSING_FIELDS: "Username and password are required",
    ACCOUNT_SUSPENDED: "Account is suspended",
  } as const,

  /** Default error toast shown by UI (used in BUG_APP assertions) */
  UI_ERROR_TOAST_TITLE: "Login failed",

  /** Valid credentials for quick reference in tests */
  CREDENTIALS: { username: "firman", password: "password" },
} as const;

// ====================================================================
// Register Module
// ====================================================================

export const REGISTER = {
  /** Pre-registered data that causes 409 Conflict */
  REGISTERED_EMAIL: "firman@gmail.com" as const,
  REGISTERED_USERNAME: "firman" as const,

  /** API response messages (from API_DOCUMENTATION.md) */
  MESSAGES: {
    SUCCESS: "Registration successful. Please log in.",
    EMAIL_EXISTS: "Email is already registered",
    USERNAME_EXISTS: "Username is already taken",
    VALIDATION_FAILED: "Validation failed",
  } as const,

  /** Default error toast title shown by UI (used in BUG_APP assertions) */
  UI_ERROR_TOAST_TITLE: "Registration failed",

  /** Base user fields for unique data generation */
  DEFAULT_USER: {
    fullName: "Test User",
    phone: "08123456789",
    password: "password123",
  },
} as const;

// ====================================================================
// Forgot Password Module
// ====================================================================

export const FORGOT_PASSWORD = {
  /** Pre-registered email for success paths */
  REGISTERED_EMAIL: "firman@gmail.com" as const,
  /** Email not in database */
  UNREGISTERED_EMAIL: "unregistered@example.com" as const,

  /** Mock OTP value for all emails */
  MOCK_OTP: "11111" as const,

  /** API response messages (from API_DOCUMENTATION.md) */
  MESSAGES: {
    OTP_SENT: "OTP has been sent to your email",
    EMAIL_NOT_FOUND: "Email tidak terdaftar",
    OTP_VERIFIED: "OTP verified successfully",
    PASSWORD_RESET: "Password has been reset successfully",
    INVALID_TOKEN: "Invalid or expired reset token",
  } as const,

  /** Mock reset tokens for test flows */
  MOCK_TOKENS: {
    FRG_010: "mock_token_frg_010",
    FRG_011: "mock_token_frg_011",
    FRG_012: "mock_token_frg_012",
    FRG_013: "mock_token_frg_013",
    FRG_015: "mock_token_frg_015",
    COMPLETE_FLOW: "mock_token_complete_flow",
  },
} as const;

// ====================================================================
// Generic error values
// ====================================================================

export const ERROR = {
  /** Simulated server error */
  INTERNAL_SERVER_ERROR: "Internal Server Error",

  /** Standard error response status codes */
  CODES: {
    SUCCESS: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500,
  } as const,
} as const;

// ====================================================================
// API endpoints
// ====================================================================

export const AUTH_ENDPOINTS = {
  LOGIN: "/e_commerce/v1/auth/login",
  REGISTER: "/e_commerce/v1/auth/register",
  FORGOT_PASSWORD: "/e_commerce/v1/auth/forgot-password",
  VERIFY_OTP: "/e_commerce/v1/auth/verify-otp",
  RESET_PASSWORD: "/e_commerce/v1/auth/reset-password",
} as const;

// ====================================================================
// URL paths
// ====================================================================

export const AUTH_ROUTES = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
} as const;
