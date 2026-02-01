# OAuth Setup Guide for JobFlow

## Current Issue
You're seeing an "Auth error: [object Object]" because the OAuth configuration needs to be properly set up in Google Cloud Console.

## Steps to Fix

### 1. Get Your Extension ID
1. Go to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Find your JobFlow extension
4. Copy the **Extension ID** (it looks like: `abcdefghijklmnopqrstuvwxyz123456`)

### 2. Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

4. Configure OAuth Consent Screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" (unless you have a Google Workspace)
   - Fill in the required fields:
     - App name: `JobFlow`
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/spreadsheets`
   - Save

5. Create OAuth 2.0 Client ID:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: **Chrome Extension**
   - Name: `JobFlow Extension`
   - **Item ID**: Paste your Extension ID from step 1
   - Click "Create"
   - Copy the generated **Client ID**

### 3. Update Your manifest.json

Replace the `client_id` in your `manifest.json` with the new Client ID:

```json
"oauth2": {
    "client_id": "YOUR_NEW_CLIENT_ID_HERE.apps.googleusercontent.com",
    "scopes": [
        "https://www.googleapis.com/auth/spreadsheets"
    ]
}
```

### 4. Reload the Extension

1. Go to `chrome://extensions`
2. Click the refresh icon on the JobFlow extension
3. Test the authentication

## Troubleshooting

### Error: "OAuth2 not granted or revoked"
- Make sure the Extension ID in Google Cloud Console matches your actual extension ID
- Check that the Google Sheets API is enabled
- Verify the OAuth consent screen is configured

### Error: "Access blocked: This app's request is invalid"
- The client_id doesn't match the extension ID
- Recreate the OAuth client with the correct extension ID

### Still Having Issues?
1. Check the browser console for detailed error messages
2. Make sure you're signed into Google Chrome
3. Try removing and re-adding the OAuth consent in Google Cloud Console
