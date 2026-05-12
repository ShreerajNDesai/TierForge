// Google Drive OAuth2 Configuration
// These credentials are internal to TierForge. The end-user never sees them.
// To set up your own: https://console.cloud.google.com → Create Project → Enable Drive API → Create OAuth2 Credentials (Web Application)
// Set redirect URI to: http://localhost:19847/callback

export const GDRIVE_CLIENT_ID = '174974463850-qu4n9sr2fk73s3hbkjnkc2tlkcpq24ib.apps.googleusercontent.com';
export const GDRIVE_CLIENT_SECRET = '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';
export const GDRIVE_REDIRECT_URI = 'http://localhost:19847/callback';
export const GDRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
