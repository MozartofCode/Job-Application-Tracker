# Google Sheets Template Setup

## Quick Setup for Your Job Tracker Spreadsheet

### Step 1: Create Your Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. Name it: **Job Applications Tracker**

### Step 2: Add Column Headers

Copy and paste these headers into **Row 1** (A1 through H1):

```
Job Title | Company | Location | Salary | URL | Date Applied | Status | Notes
```

Or add them individually:
- **A1**: Job Title
- **B1**: Company
- **C1**: Location
- **D1**: Salary
- **E1**: URL
- **F1**: Date Applied
- **G1**: Status
- **H1**: Notes

### Step 3: Format Your Sheet (Optional but Recommended)

#### Make Headers Stand Out:
1. Select row 1 (click on the row number "1")
2. Click the **Bold** button (or press Ctrl+B)
3. Change background color to a light purple: #e9d8fd
4. Center-align the text

#### Freeze the Header Row:
1. Click on **View** → **Freeze** → **1 row**
2. This keeps headers visible when scrolling

#### Set Column Widths:
- **A (Job Title)**: 250px
- **B (Company)**: 150px
- **C (Location)**: 150px
- **D (Salary)**: 120px
- **E (URL)**: 200px (set text to wrap)
- **F (Date Applied)**: 120px
- **G (Status)**: 100px
- **H (Notes)**: 300px

#### Add Data Validation for Status Column:
1. Select column G (click on "G" at the top)
2. Click **Data** → **Data validation**
3. Criteria: **List of items**
4. Items: `Saved, Applied, Interview, Rejected, Offer`
5. Check "Show dropdown list in cell"
6. Click **Save**

### Step 4: Add Conditional Formatting (Optional)

Make statuses colorful:

1. Select column G (Status column)
2. Go to **Format** → **Conditional formatting**
3. Add rules:

   **Rule 1 - Offer (Green)**
   - Format cells if: Text is exactly: `Offer`
   - Background color: #d1fae5 (light green)
   - Text color: #065f46 (dark green)

   **Rule 2 - Interview (Blue)**
   - Format cells if: Text is exactly: `Interview`
   - Background color: #dbeafe (light blue)
   - Text color: #1e40af (dark blue)

   **Rule 3 - Applied (Purple)**
   - Format cells if: Text is exactly: `Applied`
   - Background color: #e9d8fd (light purple)
   - Text color: #6b21a8 (dark purple)

   **Rule 4 - Rejected (Red)**
   - Format cells if: Text is exactly: `Rejected`
   - Background color: #fee2e2 (light red)
   - Text color: #991b1b (dark red)

### Step 5: Get Your Spreadsheet ID

1. Look at your browser's address bar
2. Copy the ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/COPY_THIS_PART_HERE/edit
   ```
3. Update the `SPREADSHEET_ID` in:
   - `background.js` (line 5)
   - `popup/popup.js` (line 7)

### Step 6: Test Your Setup

1. Make sure the sheet is named **"Sheet1"** (default name)
2. If you renamed it, update the code in `background.js` line 32:
   ```javascript
   const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/YOUR_SHEET_NAME!A1:append?...`;
   ```

---

## Sample Data (For Testing)

You can add this sample row to test formatting:

| Job Title | Company | Location | Salary | URL | Date Applied | Status | Notes |
|-----------|---------|----------|--------|-----|--------------|--------|-------|
| Senior Full-Stack Engineer | Google | Mountain View, CA | $150k - $200k | https://example.com | 2026-02-01 | Interview | Really excited about this one! |

---

## Advanced: Add Charts and Analytics

### Jobs Applied Over Time:
1. Select columns F (Date Applied) and G (Status)
2. Insert → Chart
3. Chart type: Line chart or Area chart

### Status Distribution:
1. Select column G (Status)
2. Insert → Chart
3. Chart type: Pie chart

---

## 🆘 Troubleshooting

**Problem**: Extension says "Failed to append data"
- Make sure your sheet is named **Sheet1**
- Check that row 1 has headers
- Verify the Spreadsheet ID is correct

**Problem**: Data appears in wrong columns
- Ensure headers are in the exact order listed above
- The extension writes data in this order: Title, Company, Location, Salary, URL, Date, Status, Notes

---

## 🎨 Bonus: Beautiful Gradient Header

For a premium look matching JobFlow branding:

1. Select row 1
2. Click the **fill color** button
3. Choose **Gradient**
4. Set colors: Start #667eea → End #764ba2
5. Make text white and bold

Now your sheet matches the extension's design! 💜
