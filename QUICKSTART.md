# 🚀 JobFlow - 5-Minute Quickstart Guide

## Follow These Steps in Order:

---

## ⚡ Step 1: Load Extension in Chrome (2 minutes)

1. **Open Chrome** and type in address bar: `chrome://extensions/`

2. **Enable Developer Mode**
   - Look for toggle in top-right corner
   - Click to turn it ON (should be blue)

3. **Load JobFlow**
   - Click **"Load unpacked"** button (top-left)
   - Navigate to: `C:\Users\berta\Desktop\Job-Application-Tracker`
   - Click **"Select Folder"**

4. **Extension Loaded!** ✅
   - You should see "JobFlow - Job Application Tracker" appear
   - Look for the purple gradient icon
   - **COPY YOUR EXTENSION ID** - it looks like: `abcdefghijklmnopqrstuvwxyz123456`
   - Save this ID, you'll need it next!

---

## 🔐 Step 2: Set Up Google Cloud OAuth2 (5 minutes)

### Part A: Create Project

1. Open: https://console.cloud.google.com
2. Click **"Select a project"** dropdown (top bar)
3. Click **"New Project"**
4. Name: `JobFlow Extension`
5. Click **"Create"**
6. Wait ~30 seconds for project creation

### Part B: Enable Google Sheets API

1. In the left sidebar → **APIs & Services** → **Library**
2. Search: `Google Sheets API`
3. Click on it → Click **"Enable"**
4. Wait for it to enable

### Part C: Configure OAuth Consent Screen

1. Sidebar → **APIs & Services** → **OAuth consent screen**
2. Select **"External"** user type
3. Click **"Create"**

**Fill in the form:**
- **App name**: `JobFlow`
- **User support email**: Your Gmail address
- **App logo**: (optional, skip for now)
- **Developer contact**: Your Gmail address
- Click **"Save and Continue"**

**Scopes:**
- Click **"Add or Remove Scopes"**
- Search for: `spreadsheets`
- Check the box for: `https://www.googleapis.com/auth/spreadsheets`
- Click **"Update"** then **"Save and Continue"**

**Test Users:**
- Click **"Add Users"**
- Enter YOUR Gmail address
- Click **"Add"** then **"Save and Continue"**

### Part D: Create OAuth Credentials

1. Sidebar → **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **OAuth client ID**

**IMPORTANT - Select Type:**
- Application type: **Chrome extension**
- Name: `JobFlow Extension`
- **Extension ID**: Paste the ID you copied in Step 1

3. Click **"Create"**

4. **COPY THE CLIENT ID!** 
   - It looks like: `123456789-abc123xyz.apps.googleusercontent.com`
   - Save this, you need it next!

---

## 📝 Step 3: Update manifest.json (30 seconds)

**I'll do this for you!** Just give me your OAuth2 Client ID and I'll update the file.

**Tell me:** "My OAuth2 Client ID is: [paste it here]"

Or do it manually:
1. Open: `manifest.json` (already open in your editor)
2. Find line 22 (the one with `"client_id"`)
3. Replace `YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID
4. Save the file (Ctrl+S)

---

## 🔄 Step 4: Reload Extension (10 seconds)

1. Go back to `chrome://extensions/`
2. Find JobFlow extension card
3. Click the **circular reload icon** 🔄
4. Extension reloaded! ✅

---

## 🎯 Step 5: Test Authentication (1 minute)

1. **Click the JobFlow icon** in Chrome toolbar (near address bar)
   - If you don't see it, click the puzzle piece icon and pin JobFlow

2. **Popup opens** showing:
   - Status: "Not Connected" (yellow dot)
   - Stats showing zeros

3. **Click "Connect Google Account"**
   - Google sign-in window appears
   - Select your Google account
   - Click **"Allow"** to grant permissions

4. **Success!** ✅
   - Status changes to "Connected" (green dot)
   - You're authenticated!

---

## 📊 Step 6: Prepare Google Sheet (2 minutes)

### Option A: Use Your Existing Sheet
Your extension is already configured for:
**Spreadsheet ID**: `1pZRhmdjj8g3e9BKjtxiHTrEEqyl9goGfagGdxWRLpAE`

Just make sure it has these headers in Row 1:
```
Job Title | Company | Location | Salary | URL | Date Applied | Status | Notes
```

### Option B: Create New Sheet
1. Go to: https://sheets.google.com
2. Click **"Blank"** to create new sheet
3. Add the 8 headers above in Row 1
4. Copy the Spreadsheet ID from URL
5. Tell me and I'll update the code!

---

## 🧪 Step 7: Test Capturing a Job! (1 minute)

### Test on LinkedIn:

1. **Open LinkedIn Jobs**: https://www.linkedin.com/jobs/
2. **Click any job posting** to open it
3. **Wait 1-2 seconds** for the page to load
4. **Look for the purple "Capture Job" button** near the job title
5. **Click "Capture Job"**
   - Button shows "Saving..."
   - Then "✓ Saved!"
   - Notification may appear

6. **Check your Google Sheet**
   - Open the sheet (or click "Open Google Sheet" in popup)
   - New row appears with job data!
   - Job title, company, location, URL, today's date

### Test on Company Website:

1. Visit any company career page (e.g., google.com/careers)
2. Open a job posting
3. Look for **floating purple button** (bottom-right)
4. Click to capture
5. Check Google Sheet for new row

---

## ✅ You're Done!

**JobFlow is now fully set up and working!** 🎉

### What You Can Do Now:

✅ Capture jobs from LinkedIn with one click  
✅ Capture jobs from any career site  
✅ Track all applications in Google Sheets  
✅ View stats in the popup  
✅ Works offline (syncs later)  

---

## 🆘 Stuck? Common Issues:

**"Capture Job" button not appearing:**
- Make sure you're on an actual job posting page
- Refresh the page
- Check console for errors (F12)

**"Failed to save" error:**
- Make sure you're authenticated (green dot in popup)
- Check Spreadsheet ID is correct
- Verify sheet is named "Sheet1"

**OAuth error:**
- Make sure Client ID in manifest.json is correct
- Reload extension after editing manifest.json
- Clear cookies and try authenticating again

---

## 📞 Need Help?

1. Check **TESTING.md** for detailed test cases
2. Check browser console (F12) for error messages
3. Ask me any questions!

**Happy Job Hunting! 🚀💼**
