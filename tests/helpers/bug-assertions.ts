/**
 * Helper assertions for BUG_APP detection.
 *
 * These helpers ensure BUG_APP failures produce structured,
 * informative error messages in Playwright HTML Report.
 *
 * Usage:
 *   import { assertBugApp, assertToastMismatch } from "./helpers/bug-assertions";
 *
 *   // For toast/API mismatch:
 *   const toastText = await toastLocator.textContent();
 *   if (toastText !== apiMessage) {
 *     assertToastMismatch(toastText, apiMessage, "REG-003",
 *       "UI harus menampilkan pesan error spesifik dari API");
 *   }
 *
 *   // For generic BUG_APP:
 *   assertBugApp(condition, {
 *     testId: "REG-XXX",
 *     expected: "what should happen",
 *     actual: "what actually happened",
 *     requirement: "the business rule being violated"
 *   });
 */

interface BugAppContext {
  testId: string;
  expected: string;
  actual: string;
  apiMessage?: string;
  requirement: string;
}

/**
 * Generic BUG_APP assertion.
 * Throws Error with structured format when condition is false.
 */
export function assertBugApp(condition: boolean, context: BugAppContext): void {
  if (!condition) {
    const { testId, expected, actual, apiMessage, requirement } = context;
    const parts = [
      `[${testId}] BUG_APP: Requirement tidak terpenuhi`,
      `Requirement: ${requirement}`,
      `Expected:    ${expected}`,
      `Actual:      ${actual}`,
    ];
    if (apiMessage) {
      parts.push(`API Message: ${apiMessage}`);
    }
    throw new Error(parts.join("\n"));
  }
}

/**
 * Specific helper for toast/UI message mismatch against API message.
 *
 * Dipanggil dalam guard condition: `if (toastText !== apiMessage)`
 * untuk menghasilkan error terstruktur yang terlihat di Playwright Report.
 */
export function assertToastMismatch(
  toastText: string | null,
  apiMessage: string,
  testId: string,
  requirement: string
): void {
  if (toastText !== apiMessage) {
    throw new Error(
      `[${testId}] BUG_APP: UI toast tidak sesuai API message\n` +
      `Requirement: ${requirement}\n` +
      `Expected (API): ${apiMessage}\n` +
      `Actual (UI):   ${toastText}\n` +
      `\n` +
      `Akar masalah: UI menggunakan pesan generic "${toastText}" ` +
      `bukan pesan spesifik dari API "${apiMessage}".\n` +
      `Tim frontend perlu memperbaiki komponen notifikasi ` +
      `untuk menampilkan pesan error dari server.\n` +
      `\n---\n` +
      `Klasifikasi: BUG_APP — assertion ini sengaja FAIL untuk mendeteksi bug.\n` +
      `Ketika bug diperbaiki, test ini akan otomatis PASS tanpa modifikasi.`
    );
  }
}
