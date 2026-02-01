// Universal Job Scraper Content Script
// Handles job postings on company career sites and generic job boards

console.log('🌐 JobFlow Universal scraper loaded');

// =======================
// Universal Scraper Configuration
// =======================

const UNIVERSAL_SELECTORS = {
    title: [
        'h1',
        '[class*="job-title"]',
        '[class*="position-title"]',
        '[data-job-title]',
        'meta[property="og:title"]',
        'title'
    ],
    company: [
        '[class*="company-name"]',
        '[class*="employer"]',
        'meta[property="og:site_name"]',
        '[rel="author"]'
    ],
    location: [
        '[class*="location"]',
        '[class*="city"]',
        '[class*="address"]'
    ],
    salary: [
        '[class*="salary"]',
        '[class*="compensation"]',
        '[class*="pay"]'
    ],
    applyButton: [
        'button[type="submit"]',
        '[class*="apply"]',
        'a[href*="apply"]'
    ]
};

// Keywords that suggest this is a job posting page
const JOB_PAGE_INDICATORS = [
    'job description',
    'responsibilities',
    'requirements',
    'qualifications',
    'apply now',
    'submit application',
    'career opportunity'
];

// =======================
// Helper Functions
// =======================

function getTextFromSelectors(selectors) {
    for (const selector of selectors) {
        try {
            // Handle meta tags
            if (selector.startsWith('meta[')) {
                const meta = document.querySelector(selector);
                if (meta && meta.content) return meta.content.trim();
            }

            // Handle title tag
            if (selector === 'title') {
                return document.title.split('|')[0].split('-')[0].trim();
            }

            // Regular elements
            const element = document.querySelector(selector);
            if (element) {
                const text = element.textContent.trim();
                if (text && text.length > 0 && text.length < 200) {
                    return text;
                }
            }
        } catch (e) {
            // Ignore selector errors
        }
    }
    return null;
}

function isJobPage() {
    const bodyText = document.body.textContent.toLowerCase();
    return JOB_PAGE_INDICATORS.some(indicator => bodyText.includes(indicator));
}

function extractCompanyFromUrl() {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    // Remove common prefixes
    const filtered = parts.filter(part =>
        !['www', 'careers', 'jobs', 'apply', 'com', 'net', 'org', 'io'].includes(part)
    );

    return filtered[0] ? filtered[0].charAt(0).toUpperCase() + filtered[0].slice(1) : hostname;
}

function extractJobData() {
    const data = {
        title: getTextFromSelectors(UNIVERSAL_SELECTORS.title),
        company: getTextFromSelectors(UNIVERSAL_SELECTORS.company) || extractCompanyFromUrl(),
        location: getTextFromSelectors(UNIVERSAL_SELECTORS.location),
        salary: getTextFromSelectors(UNIVERSAL_SELECTORS.salary),
        url: window.location.href,
        date: new Date().toISOString().split('T')[0],
        platform: 'Career Site',
        status: 'Saved'
    };

    console.log('📊 Extracted job data:', data);
    return data;
}

// Generate a unique job identifier from URL
function getJobId() {
    // Use pathname as identifier (removes query params that might change)
    return window.location.pathname + window.location.search.split('?')[0];
}

// =======================
// UI Injection - Floating "Capture Job" Button
// =======================

// Track saved jobs in storage using job ID
async function isJobSaved(jobId) {
    const { savedJobs = [] } = await chrome.storage.local.get('savedJobs');
    return savedJobs.includes(jobId);
}

async function markJobAsSaved(jobId) {
    const { savedJobs = [] } = await chrome.storage.local.get('savedJobs');
    if (!savedJobs.includes(jobId)) {
        savedJobs.push(jobId);
        await chrome.storage.local.set({ savedJobs });
    }
}

async function createFloatingButton() {
    const button = document.createElement('button');
    button.id = 'jobflow-floating-btn';
    button.className = 'jobflow-floating-button';

    // Check if this job was already saved using job ID
    const jobId = getJobId();
    const alreadySaved = await isJobSaved(jobId);

    if (alreadySaved) {
        button.innerHTML = `
        <div class="jobflow-fab-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="jobflow-fab-text">Saved!</span>
      `;
        button.classList.add('jobflow-success');
        button.disabled = true;
    } else {
        button.innerHTML = `
        <div class="jobflow-fab-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="jobflow-fab-text">Capture Job</span>
      `;
        button.addEventListener('click', handleCaptureClick);
    }

    return button;
}

async function handleCaptureClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const icon = button.querySelector('.jobflow-fab-icon');
    const text = button.querySelector('.jobflow-fab-text');

    try {
        // Show loading state
        button.disabled = true;
        button.classList.add('jobflow-loading');
        icon.innerHTML = `
      <svg class="jobflow-spinner" width="20" height="20" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
      </svg>
    `;
        text.textContent = 'Saving...';

        // Extract and save job data
        const jobData = extractJobData();

        const response = await chrome.runtime.sendMessage({
            action: 'SAVE_JOB',
            data: jobData
        });

        if (response.success) {
            // Mark job as saved in storage using job ID
            const jobId = getJobId();
            await markJobAsSaved(jobId);

            // Show success state PERMANENTLY
            button.classList.remove('jobflow-loading');
            button.classList.add('jobflow-success');
            icon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      `;
            text.textContent = 'Saved!';
            // Keep button disabled - no reset!
        } else {
            throw new Error(response.error || 'Failed to save');
        }

    } catch (error) {
        console.error('❌ Error capturing job:', error);

        button.classList.remove('jobflow-loading');
        button.classList.add('jobflow-error');
        icon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `;
        text.textContent = 'Error';

        setTimeout(() => {
            button.classList.remove('jobflow-error');
            icon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      `;
            text.textContent = 'Capture Job';
            button.disabled = false;
        }, 3000);
    }
}

// =======================
// Button Injection Logic
// =======================

async function injectFloatingButton() {
    // Check if button already exists
    if (document.getElementById('jobflow-floating-btn')) {
        return;
    }

    // Only inject on job pages
    if (!isJobPage()) {
        console.log('🚫 Not a job page, skipping button injection');
        return;
    }

    const button = await createFloatingButton();
    document.body.appendChild(button);
    console.log('✅ Floating capture button injected');
}

// =======================
// Initialization
// =======================

// Inject button when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(injectFloatingButton, 1000);
    });
} else {
    setTimeout(injectFloatingButton, 1000);
}

console.log('🌐 JobFlow Universal scraper initialized');
