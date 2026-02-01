# JobFlow Extension Configuration Guide

## 📋 Required Setup

Before using JobFlow, you need to configure two important values:

### 1. OAuth2 Client ID (in `manifest.json`)

**Current Status**: ⚠️ NOT CONFIGURED

**Location**: Line 22 of `manifest.json`

**What to do**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Follow the OAuth2 setup steps in README.md
3. Copy your OAuth2 Client ID
4. Replace this line in `manifest.json`:
   ```json
   "client_id": "YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com"
   ```
   With your actual Client ID:
   ```json
   "client_id": "123456789-abcdefghijk.apps.googleusercontent.com"
   ```

### 2. Google Spreadsheet ID (in `background.js`)

**Current Status**: ✅ CONFIGURED
- Spreadsheet ID: `1pZRhmdjj8g3e9BKjtxiHTrEEqyl9goGfagGdxWRLpAE`
- Location: Line 5 of `background.js`

**To change**:
1. Create/open your Google Sheet
2. Copy the ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit
   ```
3. Update line 5 in `background.js`:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   ```

Also update line 7 in `popup/popup.js`:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   ```

---

## 🔐 Security Notes

- **Never commit** your OAuth Client ID or API keys to public repositories
- Add `.env` files to `.gitignore` if storing secrets
- Use environment variables for production deployments
- The current `manifest.json` has a placeholder - you must replace it!

---

## ✅ Configuration Checklist

- [ ] OAuth2 Client ID added to `manifest.json`
- [ ] Google Cloud project created
- [ ] Google Sheets API enabled
- [ ] OAuth consent screen configured
- [ ] Test user (your email) added
- [ ] Spreadsheet created with proper headers
- [ ] Spreadsheet ID verified in `background.js` and `popup/popup.js`
- [ ] Extension loaded in Chrome
- [ ] Successfully authenticated via popup

---

## 🆘 Quick Troubleshooting

**Problem**: "OAuth2 not configured" error
- **Solution**: Check that your Client ID in `manifest.json` is correct and doesn't have quotes or spaces

**Problem**: "Failed to save to Google Sheets"
- **Solution**: 
  1. Verify Spreadsheet ID is correct
  2. Make sure sheet is named "Sheet1" (or update the code)
  3. Check that Google Sheets API is enabled in Google Cloud

**Problem**: "Cannot read properties of undefined"
- **Solution**: Reload the extension in `chrome://extensions/`

---

For detailed setup instructions, see [README.md](README.md)
