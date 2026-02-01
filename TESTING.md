# 🧪 Testing Guide for JobFlow

## Quick Test Checklist

### Phase 1: Installation & Setup ✅

- [ ] **Load Extension**
  1. Open Chrome → `chrome://extensions/`
  2. Enable Developer Mode
  3. Click "Load unpacked"
  4. Select `Job-Application-Tracker` folder
  5. Extension appears with JobFlow icon

- [ ] **Configure OAuth2**
  1. Open `setup-helper.html` in browser
  2. Copy Extension ID from chrome://extensions/
  3. Follow Google Cloud setup steps
  4. Get OAuth2 Client ID
  5. Update `manifest.json` line 22
  6. Reload extension

- [ ] **Prepare Spreadsheet**
  1. Create new Google Sheet
  2. Add headers (see SHEETS_TEMPLATE.md)
  3. Verify Spreadsheet ID matches code
  4. Sheet is named "Sheet1"

---

### Phase 2: Authentication Test 🔐

1. **Open Extension Popup**
   - Click JobFlow icon in Chrome toolbar
   - Should see "Not Connected" status

2. **Authenticate**
   - Click "Connect Google Account"
   - Google OAuth consent screen appears
   - Select your Google account
   - Grant permissions for Google Sheets
   - Popup shows "Connected" status

3. **Verify Connection**
   - Status indicator turns green
   - Stats show "0" for all counters (fresh install)

---

### Phase 3: LinkedIn Test 💼

1. **Navigate to LinkedIn Job**
   - Go to https://linkedin.com/jobs
   - Open any job posting
   - Wait 1-2 seconds for page to load

2. **Find Capture Button**
   - Look for purple "Capture Job" button near job title
   - Button should have gradient styling
   - Hover shows slight elevation effect

3. **Capture a Job**
   - Click "Capture Job" button
   - Button shows spinner and "Saving..." text
   - After ~1 second, shows checkmark and "Saved!"
   - Notification appears (if enabled)

4. **Verify in Popup**
   - Click extension icon
   - Stats show: Total = 1, Synced = 1
   - "Open Google Sheet" button is clickable

5. **Check Google Sheets**
   - Click "Open Google Sheet" in popup
   - New row appears with job data:
     - Job title extracted
     - Company name
     - Location (if available)
     - LinkedIn URL
     - Today's date
     - Status = "Saved"

---

### Phase 4: Career Site Test 🌐

1. **Test on Company Website**
   - Visit any company career page (e.g., Google Careers, Apple Jobs)
   - Look for job posting page (usually has "Job Description", "Apply Now")

2. **Find Floating Button**
   - Purple floating button appears bottom-right
   - Shows "+ Capture Job" text
   - Button floats above page content

3. **Capture Generic Job**
   - Click floating "Capture Job" button
   - Same saving animation as LinkedIn
   - Success confirmation appears

4. **Verify Data Quality**
   - Check Google Sheet
   - New row added with:
     - Job title (from h1 or page title)
     - Company (from URL or meta tags)
     - Current URL
     - Today's date
     - Platform = "Career Site"

---

### Phase 5: Offline Queue Test 📴

1. **Disable Internet**
   - Turn off WiFi or disconnect ethernet
   - OR use Chrome DevTools → Network → Offline

2. **Capture Jobs While Offline**
   - Visit LinkedIn job (already loaded)
   - Click "Capture Job"
   - Button shows success (optimistic UI)
   - Data saved to local queue

3. **Check Queue Status**
   - Open popup (works offline)
   - Stats show "Pending" count increased
   - "Synced" count unchanged

4. **Re-enable Internet**
   - Turn WiFi back on
   - Extension auto-syncs within 5 minutes
   - OR click "Sync Now" in popup for immediate sync

5. **Verify Sync**
   - Pending drops to 0
   - Synced increases
   - All jobs appear in Google Sheet

---

### Phase 6: Edge Cases 🔍

**Test 1: Invalid Selectors**
- Visit a page that's not a job posting
- Universal scraper should detect and skip
- No button appears (intended behavior)

**Test 2: Multiple Fast Captures**
- Capture 3-5 jobs quickly in a row
- All should queue successfully
- All should sync to sheet in correct order
- No duplicates or missing jobs

**Test 3: Token Expiration**
- Leave extension idle for 1+ hour
- Capture a job
- Extension should auto-refresh OAuth token
- Job saves successfully

**Test 4: Spreadsheet Permissions**
- Share spreadsheet with "View only" access
- Try to capture job
- Should fail gracefully with error message
- Check console for helpful error

---

## Expected Performance Benchmarks ⚡

| Action | Expected Time |
|--------|---------------|
| Button injection (LinkedIn) | < 1 second |
| Job capture (online) | 1-2 seconds |
| Popup open | < 0.5 seconds |
| Sync queue (10 jobs) | 3-5 seconds |
| OAuth authentication | 5-10 seconds |

---

## Common Issues & Solutions 🔧

### ❌ Button Not Appearing

**LinkedIn:**
- Page structure may have changed
- Open DevTools Console
- Check for "JobFlow LinkedIn scraper loaded" message
- Update selectors in `content/linkedin.js`

**Career Sites:**
- Check console for "Not a job page" message
- Page may not have job keywords
- Add domain to supported sites list

### ❌ "Failed to Save" Error

**Check:**
1. OAuth token still valid (re-authenticate)
2. Spreadsheet ID is correct
3. Sheet named "Sheet1" exactly
4. Google Sheets API enabled
5. Console shows detailed error message

### ❌ Data in Wrong Columns

**Fix:**
- Ensure headers match exact order:
  - A: Job Title, B: Company, C: Location, etc.
- Check `background.js` line 27-35 for row format

---

## Debug Mode 🐛

Enable verbose logging:

1. Open DevTools (F12)
2. Go to Console tab
3. Look for messages starting with:
   - 🔵 LinkedIn scraper
   - 🌐 Universal scraper
   - 📨 Background received message
   - ✅ Job saved to Google Sheets

All operations are logged for debugging!

---

## Automated Testing (Future)

Future versions will include:
- Selenium tests for button injection
- Mock Google Sheets API responses
- Unit tests for scraper functions
- CI/CD with GitHub Actions

---

## Feedback & Bug Reports 🐛

Found a bug? Please report:

1. Go to [GitHub Issues](https://github.com/MozartofCode/Job-Application-Tracker/issues)
2. Provide:
   - Browser version
   - Extension version
   - Job site URL (if public)
   - Console error messages
   - Expected vs actual behavior

---

**Happy Testing! 🚀**

If all tests pass, you're ready to start tracking your job applications!
