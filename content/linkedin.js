// LinkedIn Job Scraper Content Script
// Extracts job details from LinkedIn job postings

console.log('🔵 JobFlow LinkedIn scraper loaded');

// =======================
// LinkedIn Selectors (Updated for 2026)
// =======================

const SELECTORS = {
    title: [
        '.job-details-jobs-unified-top-card__job-title',
        '.jobs-unified-top-card__job-title',
        'h1.t-24',
        '[data-job-title]'
    ],
    company: [
        '.job-details-jobs-unified-top-card__company-name',
        '.jobs-unified-top-card__company-name',
        '.job-details-jobs-unified-top-card__company-name a',
        '[data-job-company-name]'
    ],
    location: [
        '.job-details-jobs-unified-top-card__primary-description',
        '.jobs-unified-top-card__primary-description',
        '.job-details-jobs-unified-top-card__bullet',
        '.jobs-unified-top-card__bullet',
        'span.tvm__text.tvm__text--low-emphasis',
        '[data-job-location]'
    ],
    salary: [
        '.job-details-jobs-unified-top-card__job-insight--highlight',
        '.job-details-jobs-unified-top-card__job-insight',
        '.compensation__salary',
        'li.job-details-jobs-unified-top-card__job-insight',
        '.mt5.mb2 span'
    ],
    description: [
        '.jobs-description-content__text',
        '.jobs-box__html-content',
        '[data-job-description]'
    ]
};

// =======================
// Helper Functions
// =======================

function getTextFromSelectors(selectors) {
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const text = element.textContent.trim();
            // Skip if it's just empty or too generic
            if (text && text.length > 0 && text.length < 500) {
                return text;
            }
        }
    }
    return null;
}

// Extract unique job ID from LinkedIn URL
function getJobId() {
    const urlMatch = window.location.href.match(/\/jobs\/view\/(\d+)/);
    if (urlMatch) {
        return urlMatch[1];
    }
    // Fallback to current URL if no job ID found
    return window.location.pathname;
}

function extractJobData() {
    const data = {
        title: getTextFromSelectors(SELECTORS.title),
        company: getTextFromSelectors(SELECTORS.company),
        location: getTextFromSelectors(SELECTORS.location),
        salary: getTextFromSelectors(SELECTORS.salary),
        url: window.location.href,
        date: new Date().toISOString().split('T')[0],
        platform: 'LinkedIn',
        status: 'Saved'
    };

    // Clean up location (remove extra info like date posted, etc.)
    if (data.location) {
        data.location = data.location
            .split('·')[0]
            .split('(')
        [0]
            .replace(/\d+\s+(day|hour|week|month)s?\s+ago/gi, '')
            .trim();
    }

    // Clean up salary (extract just the salary range)
    if (data.salary) {
        // Look for patterns like $XX,XXX - $XX,XXX or $XXk - $XXk
        const salaryMatch = data.salary.match(/\$[\d,]+\s*-\s*\$[\d,]+|\$[\d]+k\s*-\s*\$[\d]+k/i);
        if (salaryMatch) {
            data.salary = salaryMatch[0];
        }
    }

    console.log('📊 Extracted job data:', data);
    return data;
}

// =======================
// UI Injection - "Capture Job" Button
// =======================

// Track saved jobs in storage using unique job ID
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

async function createCaptureButton() {
    const button = document.createElement('button');
    button.id = 'jobflow-capture-btn';
    button.className = 'jobflow-capture-button';

    // Check if this job was already saved using job ID
    const jobId = getJobId();
    const alreadySaved = await isJobSaved(jobId);

    if (alreadySaved) {
        button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Saved!</span>
      `;
        button.classList.add('jobflow-success');
        button.disabled = true;
    } else {
        button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Capture Job</span>
      `;
        button.addEventListener('click', handleCaptureClick);
    }

    return button;
}

async function handleCaptureClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;

    try {
        // Show loading state
        button.disabled = true;
        button.innerHTML = `
      <svg class="jobflow-spinner" width="16" height="16" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
      </svg>
      <span>Saving...</span>
    `;

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
            button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Saved!</span>
      `;
            button.classList.add('jobflow-success');
            // Keep button disabled - no reset!
        } else {
            throw new Error(response.error || 'Failed to save');
        }

    } catch (error) {
        console.error('❌ Error capturing job:', error);

        button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>Error</span>
    `;
        button.classList.add('jobflow-error');

        // Only reset on error after 2 seconds
        setTimeout(() => {
            button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Capture Job</span>
      `;
            button.disabled = false;
            button.classList.remove('jobflow-error');
        }, 2000);
    }
}

// =======================
// Button Injection Logic
// =======================

async function injectCaptureButton() {
    // Check if button already exists
    if (document.getElementById('jobflow-capture-btn')) {
        return;
    }

    // Try to find the job title container
    const titleContainer = document.querySelector(
        '.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24'
    );

    if (titleContainer) {
        const button = await createCaptureButton();

        // Insert button inline right after the title element
        // Find the best container that holds the title
        const titleParent = titleContainer.closest('.job-details-jobs-unified-top-card__container--two-pane')
            || titleContainer.closest('.jobs-unified-top-card__content')
            || titleContainer.parentElement;

        if (titleParent) {
            // Create a wrapper div to hold title and button inline
            const buttonWrapper = document.createElement('div');
            buttonWrapper.style.display = 'inline-flex';
            buttonWrapper.style.alignItems = 'center';
            buttonWrapper.style.gap = '12px';
            buttonWrapper.style.marginTop = '8px';

            buttonWrapper.appendChild(button);

            // Insert after the title container
            titleContainer.parentElement.insertBefore(buttonWrapper, titleContainer.nextSibling);
            console.log('✅ Capture button injected');
        }
    }
}

// =======================
// Initialization
// =======================

// Inject button when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCaptureButton);
} else {
    injectCaptureButton();
}

// Re-inject on dynamic content changes (LinkedIn uses heavy AJAX)
let lastUrl = window.location.href;
let injectionTimeout;

const observer = new MutationObserver(() => {
    // Check if URL changed (for internal tracking/reset if needed)
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        // Optionally remove old button if needed, but usually redundant as DOM is replaced
    }

    // Debounce the injection call to avoid performance hits
    clearTimeout(injectionTimeout);
    injectionTimeout = setTimeout(() => {
        injectCaptureButton();
    }, 500);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('🔵 JobFlow LinkedIn scraper initialized');
