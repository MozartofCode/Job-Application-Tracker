# Job Application Tracker - Technical Architecture & Google Sheets Integration

## 1. High-Level Architecture
**Stack**: 
- **Frontend**: Chrome Extension (Manifest V3) - Content Scripts & Service Worker.
- **Backend**: Google Apps Script (GAS) acting as a lightweight API Gateway.
- **Database**: Google Sheets.

### Data Flow
1.  **User Action**: User clicks "Save Job" on a posting (e.g., LinkedIn, Indeed).
2.  **Extraction**: Content Script identifies the domain and uses the "Universal Scraper" logic to extract fields (Title, Company, Location, etc.).
3.  **Async Transmission**: Content Script sends data to the Background Service Worker.
4.  **Queueing**: Background Worker saves the payload to `chrome.storage.local` (handling offline/retry logic).
5.  **API Call**: Background Worker sends a `POST` request to the Google Apps Script Web App URL.
6.  **Storage**: GAS `doPost(e)` function parses the JSON and appends a row to the Google Sheet.
7.  **Feedback**: Extension icon updates (e.g., turns green) to confirm success.

---

## 2. Core Functions List

### Frontend (Extension)
*   `detectPlatform()`: Identifies the current website (LinkedIn, Indeed, generic) to select the scraping strategy.
*   `scrapeJobDetails(strategy)`: Extracts text/metadata based on the selected strategy's selectors.
*   `createPayload(jobData)`: Formats the data into the standard JSON structure expected by the backend.
*   `saveJobToQueue(payload)`: Saves the job to `chrome.storage` for resilience.
*   `syncQueue()`: (Background) Checks for unsent jobs and attempts to send them to GAS.

### Backend (Google Apps Script)
*   `doPost(e)`: The main entry point for HTTP POST requests. Handles CORS and JSON parsing.
*   `validateAuth(token)`: Checks a simple shared secret (API Key) to prevent unauthorized spam.
*   `formatRow(json)`: Maps the incoming JSON properties to the specific column order of the Sheet.
*   `appendRowToSheet(rowArray)`: Uses `SpreadsheetApp` (or Sheets API) to safely add the data.

---

## 3. Universal Scraper Logic
To avoid writing custom code for every site, we use a **Configuration-Driven** approach.

```javascript
const SCRAPER_MAP = {
  "linkedin.com": {
    title: ".job-details-jobs-unified-top-card__job-title",
    company: ".job-details-jobs-unified-top-card__company-name",
    location: ".job-details-jobs-unified-top-card__bullet",
    date: "time"
  },
  "indeed.com": {
    title: ".jobsearch-JobInfoHeader-title",
    company: "[data-testid='inlineHeader-companyName']",
    location: "[data-testid='inlineHeader-companyLocation']",
    date: ".my-date-selector"
  },
  "default": {
    // Fallbacks using meta tags or common schema.org structures
    title: "h1",
    company: "meta[property='og:site_name']",
    location: null, 
    date: () => new Date().toISOString()
  }
};

function getScraperStrategy(url) {
    const hostname = new URL(url).hostname;
    for (const domain in SCRAPER_MAP) {
        if (hostname.includes(domain)) return SCRAPER_MAP[domain];
    }
    return SCRAPER_MAP["default"];
}

function universalScrape() {
   const strategy = getScraperStrategy(window.location.href);
   // Logic to querySelector(strategy.field) and getText
}
```

---

## 4. Async Data Transmission Plan
The browser must **never hang**. We decouple "Click" from "Network Request".

1.  **Optimistic UI**: When the user clicks "Save", the button immediately shows a spinner or checkmark.
2.  **Service Worker Delegation**: The content script does *not* `fetch` directly. It sends a message:
    ```javascript
    chrome.runtime.sendMessage({ action: "SAVE_JOB", data: jobPayload });
    ```
3.  **Background Processing**:
    *   The Service Worker receives the message.
    *   It *first* saves to `chrome.storage.local` with a status of `pending`.
    *   It attempts the `fetch` to GAS.
    *   **Success**: Mark item as `synced` in storage.
    *   **Failure**: Keep as `pending`. Use an alarm (`chrome.alarms`) to retry every 5 minutes.

---

## 5. Google Sheets API Logic (The "Why" & "How")

### The 'Why': Append vs Update
For a job tracker, you almost exclusively want **`spreadsheets.values.append`**:
1.  **Race Condition Safe**: `Append` automatically finds the "next available row". If you used `Update`, you would first need to `Get` the sheet data to calculate the next empty row index (e.g., Row 50), then send an `Update` to Row 50. If two jobs are saved quickly, both might try to write to Row 50, overwriting one another.
2.  **Performance**: It is a single atomic operation. No need to read the sheet size first.
3.  **Simplicity**: You don't need to manage Grid IDs or A1 notation (e.g., `Sheet1!A51:D51`). You just say "Put this in `Sheet1`".

### Machine Instructions: Setting up Google Cloud Console
*These steps assume you want to enable the API for potentially advanced usage or direct access. For a simple GAS wrapper, the GAS project acts as the GCP container automatically.*

1.  **Create Project**:
    *   Go to [console.cloud.google.com](https://console.cloud.google.com).
    *   Click the Project Dropdown (top left) > **New Project**.
    *   Name it `Job-Tracker-Extension`.

2.  **Enable Sheets API**:
    *   In the sidebar, go to **APIs & Services** > **Library**.
    *   Search for "Google Sheets API".
    *   Click **Enable**.

3.  **OAuth Consent Screen** (For access token generation):
    *   Go to **APIs & Services** > **OAuth consent screen**.
    *   Select **User Type**: `External` (unless you have a G-Suite Workspace Organization, then choose `Internal`).
        *   *Note: For personal Gmail accounts, you must choose External.*
    *   Fill in required info (App Name: "Job Tracker", User Support Email: Your Email).
    *   **Scopes**: Add `.../auth/spreadsheets`.
    *   **Test Users**: Add your own email address. This is critical for personal apps to avoid verification processes.

4.  **Credentials**:
    *   Go to **Credentials**.
    *   Click **Create Credentials** > **OAuth client ID**.
    *   Application Type: **Chrome App** (or Web Application if sticking to GAS web app flow).
    *   Copy the **Client ID**.

### The Payload
When sending data to the `spreadsheets.values.append` endpoint (or your GAS equivalent), the structure follows a `row` based logic.

**Target**: `POST https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}:append?valueInputOption=USER_ENTERED`

**Body**:
```json
{
  "range": "Sheet1!A1",
  "majorDimension": "ROWS",
  "values": [
    [
      "Senior Full-Stack Engineer",  // Column A: Job Title
      "Google",                      // Column B: Company
      "Mountain View, CA",           // Column C: Location
      "2023-10-27"                   // Column D: Date Applied
    ]
  ]
}
```

*Note: For the Google Apps Script `doPost` wrapper, you can simplify this to just key-value pairs, and let GAS format it into the array above.*
