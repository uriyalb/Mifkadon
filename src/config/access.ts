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
  allowlistSheetId: '1r8tKYZ2j2bwcT4vYRUVBJ85PAwX9L0Fg86mgk68mJro',

  /**
   * Tab name inside the allowlist spreadsheet.
   * Emails should be listed in column A.
   */
  allowlistTab: 'emails',

  /**
   * WhatsApp phone number (with country code, no +/spaces) to send access requests to.
   */
  whatsappNumber: '972522622649',

  /**
   * Pre-filled WhatsApp message when requesting access.
   * The placeholder {email} will be replaced with the user's Google email.
   */
  whatsappMessage: 'היי, אשמח לקבל גישה למיפקדון. המייל שלי: {email}',
} as const;
