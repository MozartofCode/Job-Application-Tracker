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
        '.job-details-jobs-unified-top-card__bullet',
        '.jobs-unified-top-card__bullet',
        '[data-job-location]'
    ],
    salary: [
        '.job-details-jobs-unified-top-card__job-insight',
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
        const element = document.querySelector(selector);
        if (element) {
            const text = element.textContent.trim();
            if (text) return text;
        }
    }
    return null;
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

    // Clean up location (remove extra info)
    if (data.location) {
        data.location = data.location.split('·')[0].trim();
    }

    console.log('📊 Extracted job data:', data);
    return data;
}

// =======================
// UI Injection - "Capture Job" Button
// =======================

// Track saved jobs in storage
async function isJobSaved(url) {
    const { savedJobs = [] } = await chrome.storage.local.get('savedJobs');
    return savedJobs.includes(url);
}

async function markJobAsSaved(url) {
    const { savedJobs = [] } = await chrome.storage.local.get('savedJobs');
    if (!savedJobs.includes(url)) {
        savedJobs.push(url);
        await chrome.storage.local.set({ savedJobs });
    }
}

async function createCaptureButton() {
    const button = document.createElement('button');
    button.id = 'jobflow-capture-btn';
    button.className = 'jobflow-capture-button';

    // Check if this job was already saved
    const currentUrl = window.location.href;
    const alreadySaved = await isJobSaved(currentUrl);

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
            // Mark job as saved in storage
            await markJobAsSaved(window.location.href);

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

        // Insert button next to the title
        const wrapper = titleContainer.parentElement;
        if (wrapper) {
            wrapper.style.position = 'relative';
            wrapper.appendChild(button);
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
