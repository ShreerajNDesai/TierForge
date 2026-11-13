// Google Drive OAuth2 Configuration
// For security in public repositories, credentials should be configured
// via environment variables (.env) or database settings rather than hardcoded.
//
// To set up your own:
// 1. Visit https://console.cloud.google.com -> Create Project
// 2. Enable the Google Drive API
// 3. Create OAuth2 Credentials (Web Application)
// 4. Set Authorized redirect URI to: http://localhost:19847/callback

export const GDRIVE_CLIENT_ID =
  process.env.GDRIVE_CLIENT_ID ||
  '174974463850-qu4n9sr2fk73s3hbkjnkc2tlkcpq24ib.apps.googleusercontent.com'
export const GDRIVE_CLIENT_SECRET = process.env.GDRIVE_CLIENT_SECRET || ''
export const GDRIVE_REDIRECT_URI =
  process.env.GDRIVE_REDIRECT_URI || 'http://localhost:19847/callback'
export const GDRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
