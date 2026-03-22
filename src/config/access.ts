// ── Access control configuration ────────────────────────────────────────────
//
// Controls who can use the app after Google OAuth login.
// A public Google Sheet holds the allowlist of approved emails.

export const ACCESS_CONFIG = {
  /**
   * Set to true to enable the email allowlist check.
   * When false, any Google account can log in.
   */
  enabled: true,

  /**
   * The spreadsheet ID of the public Google Sheet containing allowed emails.
   * The sheet should have emails in column A (no header required).
   * Make sure the sheet is published / shared as "Anyone with the link can view".
   */
  allowlistSheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',

  /**
   * Tab name inside the allowlist spreadsheet.
   * Emails should be listed in column A.
   */
  allowlistTab: 'Sheet1',

  /**
   * WhatsApp phone number (with country code, no +/spaces) to send access requests to.
   */
  whatsappNumber: '972544760589',

  /**
   * Pre-filled WhatsApp message when requesting access.
   * The placeholder {email} will be replaced with the user's Google email.
   */
  whatsappMessage: 'היי, אשמח לקבל גישה למיפקדון. המייל שלי: {email}',
} as const;
