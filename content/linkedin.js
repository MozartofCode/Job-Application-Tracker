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
        'h1',
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
            if (text && text.length > 0 && text.length < 500) {
                return text;
            }
        }
    }
    return null;
}

// Extract salary from job description body as fallback
function extractSalaryFromBody() {
    const description = getTextFromSelectors(SELECTORS.description);
    if (!description) return null;

    const salaryPatterns = [
        /\$[\d,]+\s*-\s*\$[\d,]+(?:\s*(?:per|\/)\s*(?:year|yr|annum|hour|hr))?/gi,
        /\$[\d]+k\s*-\s*\$[\d]+k/gi,
        /salary.*?\$[\d,]+/gi,
        /compensation.*?\$[\d,]+/gi,
        /[\d,]+\s*-\s*[\d,]+\s*(?:USD|dollars)/gi
    ];

    for (const pattern of salaryPatterns) {
        const match = description.match(pattern);
        if (match) {
            return match[0].trim();
        }
    }

    return null;
}

// Extract location from job description body as fallback
function extractLocationFromBody() {
    const description = getTextFromSelectors(SELECTORS.description);
    if (!description) return null;

    const locationPatterns = [
        /(?:location|based in|office in|located in):?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})/i,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})(?:\s+or\s+Remote)?/,
        /(?:Remote|Hybrid).*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})/i
    ];

    for (const pattern of locationPatterns) {
        const match = description.match(pattern);
        if (match) {
            return match[1] || match[0].trim();
        }
    }

    return null;
}

// Extract unique job ID from LinkedIn URL
function getJobId() {
    const url = window.location.href;
    console.log('🔗 Current URL:', url);

    // Try different LinkedIn URL patterns
    const patterns = [
        /\/jobs\/view\/(\d+)/,           // /jobs/view/1234567
        /currentJobId=(\d+)/,             // ?currentJobId=1234567
        /\/jobs\/collections\/.*?\/(\d+)/ // /jobs/collections/.../1234567
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            console.log('✅ Extracted job ID:', match[1], 'using pattern:', pattern);
            return match[1];
        }
    }

    // Fallback to pathname
    const fallback = window.location.pathname;
    console.log('⚠️ No job ID found, using pathname fallback:', fallback);
    return fallback;
}

function extractJobData() {
    let data = {
        title: getTextFromSelectors(SELECTORS.title),
        company: getTextFromSelectors(SELECTORS.company),
        location: getTextFromSelectors(SELECTORS.location),
        salary: getTextFromSelectors(SELECTORS.salary),
        url: window.location.href,
        date: new Date().toISOString().split('T')[0],
        platform: 'LinkedIn',
        status: 'Saved'
    };

    // Try to get from body if not found in header
    if (!data.salary) {
        data.salary = extractSalaryFromBody();
    }
    if (!data.location) {
        data.location = extractLocationFromBody();
    }

    // Clean up location
    if (data.location) {
        data.location = data.location
            .split('·')[0]
            .split('(')[0]
            .replace(/\d+\s+(day|hour|week|month)s?\s+ago/gi, '')
            .trim();
    }

    // Clean up salary
    if (data.salary) {
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
    console.log('💾 Storage check - Job ID:', jobId);
    console.log('💾 All saved jobs:', savedJobs);
    const isSaved = savedJobs.includes(jobId);
    console.log('💾 Is this job saved?', isSaved);
    return isSaved;
}

async function markJobAsSaved(jobId) {
    const { savedJobs = [] } = await chrome.storage.local.get('savedJobs');
    if (!savedJobs.includes(jobId)) {
        savedJobs.push(jobId);
        await chrome.storage.local.set({ savedJobs });
        console.log('💾 Job marked as saved:', jobId);
        console.log('💾 Updated saved jobs list:', savedJobs);
    }
}

async function createCaptureButton() {
    const button = document.createElement('button');
    button.id = 'jobflow-capture-btn';
    button.className = 'jobflow-capture-button';

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
        button.disabled = true;
        button.innerHTML = `
      <svg class="jobflow-spinner" width="16" height="16" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
      </svg>
      <span>Saving...</span>
    `;

        const jobData = extractJobData();

        const response = await chrome.runtime.sendMessage({
            action: 'SAVE_JOB',
            data: jobData
        });

        if (response.success) {
            const jobId = getJobId();
            await markJobAsSaved(jobId);

            button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Saved!</span>
      `;
            button.classList.add('jobflow-success');
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
    console.log('🔍 Attempting to inject button...');
    console.log('🌐 Current URL:', window.location.href);
    console.log('📄 Document ready state:', document.readyState);

    // Log all h1 elements to see what's on the page
    const allH1s = document.querySelectorAll('h1');
    console.log('📝 Found', allH1s.length, 'h1 elements on page');
    allH1s.forEach((h1, idx) => {
        console.log(`  H1 #${idx}:`, h1.textContent.substring(0, 50), '| Classes:', h1.className);
    });

    // Try to find the job title element with multiple strategies
    let titleElement = null;
    let insertionPoint = null;
    let strategyUsed = '';

    // Strategy 1: Try all our selectors
    for (const selector of SELECTORS.title) {
        titleElement = document.querySelector(selector);
        if (titleElement) {
            console.log('✅ Found title with selector:', selector);
            strategyUsed = 'Selector: ' + selector;
            insertionPoint = titleElement;
            break;
        } else {
            console.log('❌ Selector failed:', selector);
        }
    }

    // Strategy 2: If still not found, use the first h1 that looks like a job title
    if (!titleElement && allH1s.length > 0) {
        for (const h1 of allH1s) {
            const text = h1.textContent.trim();
            if (text.length > 10 && text.length < 200) {
                titleElement = h1;
                strategyUsed = 'Fallback H1';
                insertionPoint = h1;
                console.log('✅ Using fallback h1:', text.substring(0, 50));
                break;
            }
        }
    }

    // Strategy 3: Find common LinkedIn job containers as fallback
    if (!titleElement) {
        const containers = [
            '.jobs-unified-top-card',
            '.job-details-jobs-unified-top-card',
            '.jobs-details__main-content',
            'main'
        ];

        for (const containerSel of containers) {
            const container = document.querySelector(containerSel);
            if (container) {
                console.log('⚠️ Using container fallback:', containerSel);
                insertionPoint = container;
                strategyUsed = 'Container fallback: ' + containerSel;
                break;
            }
        }
    }

    if (!insertionPoint) {
        console.error('❌ Could not find ANY insertion point on page');
        console.error('❌ Page structure may have changed or this is not a job page');
        console.log('💡 Trying body fallback...');

        // Last resort: try to inject at the top of body
        const body = document.querySelector('body');
        if (body && body.children.length > 0) {
            insertionPoint = body.children[0];
            strategyUsed = 'Body fallback';
            console.log('⚠️ Using body fallback - button may appear in wrong location');
        } else {
            console.error('❌ Complete failure - cannot inject anywhere');
            return;
        }
    }

    console.log('📍 Insertion point:', strategyUsed);
    if (titleElement) {
        console.log('📍 Title text:', titleElement.textContent.substring(0, 50));
    }
    console.log('📍 Parent node:', insertionPoint.parentNode?.tagName);

    const currentJobId = getJobId();
    console.log('🆔 Current job ID:', currentJobId);

    // Check if wrapper already exists
    let wrapper = document.querySelector('.jobflow-button-wrapper');

    if (wrapper) {
        console.log('🔄 Wrapper already exists, checking job ID...');
        const existingButton = document.getElementById('jobflow-capture-btn');
        if (existingButton) {
            const buttonJobId = existingButton.getAttribute('data-job-id');
            console.log('🆔 Existing button job ID:', buttonJobId);
            if (buttonJobId === currentJobId) {
                console.log('✅ Same job, keeping current button');

                // Verify button is visible
                const rect = wrapper.getBoundingClientRect();
                console.log('👁️ Button visibility:', {
                    width: rect.width,
                    height: rect.height,
                    top: rect.top,
                    display: window.getComputedStyle(wrapper).display,
                    visible: rect.width > 0 && rect.height > 0
                });

                return;
            }
        }
        console.log('🗑️ Different job - removing old wrapper');
        wrapper.remove();
    }

    // Create and configure new button
    console.log('🔨 Creating new button...');
    const button = await createCaptureButton();
    button.setAttribute('data-job-id', currentJobId);

    // Create new wrapper with enhanced visibility
    wrapper = document.createElement('div');
    wrapper.className = 'jobflow-button-wrapper';
    wrapper.id = 'jobflow-wrapper-' + Date.now();
    wrapper.style.cssText = `
        display: flex !important;
        align-items: center;
        margin-top: 12px;
        margin-bottom: 12px;
        z-index: 9999;
        visibility: visible !important;
        opacity: 1 !important;
    `;
    wrapper.appendChild(button);

    // Insert after title or at insertion point
    try {
        if (titleElement && titleElement.nextSibling) {
            titleElement.parentNode.insertBefore(wrapper, titleElement.nextSibling);
            console.log('✅ Button inserted after title element');
        } else if (titleElement) {
            titleElement.parentNode.appendChild(wrapper);
            console.log('✅ Button appended to title parent');
        } else {
            // Fallback insertion
            insertionPoint.insertAdjacentElement('afterbegin', wrapper);
            console.log('⚠️ Button inserted at fallback location (may not be ideal)');
        }

        console.log('✅ Button successfully injected for job:', currentJobId);

        // Verify injection
        const injectedWrapper = document.getElementById(wrapper.id);
        if (injectedWrapper) {
            const rect = injectedWrapper.getBoundingClientRect();
            console.log('✅ Button confirmed in DOM');
            console.log('👁️ Button dimensions:', {
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left
            });
            console.log('👁️ Button styles:', {
                display: window.getComputedStyle(injectedWrapper).display,
                visibility: window.getComputedStyle(injectedWrapper).visibility,
                opacity: window.getComputedStyle(injectedWrapper).opacity
            });

            if (rect.width === 0 || rect.height === 0) {
                console.error('⚠️ WARNING: Button is in DOM but has zero size!');
            }
        } else {
            console.error('❌ Button injection failed - not found in DOM');
        }
    } catch (error) {
        console.error('❌ Error inserting button:', error);
        console.error('Error details:', error.stack);
    }
}

// =======================
// Initialization
// =======================

console.log('🚀 Initializing JobFlow...');

// Initial injection
setTimeout(() => {
    console.log('⏰ Running initial injection (after 1s delay)');
    injectCaptureButton();
}, 1000);

// Also try immediately
if (document.readyState !== 'loading') {
    console.log('⏰ Document ready, injecting immediately');
    injectCaptureButton();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('⏰ DOMContentLoaded fired, injecting');
        injectCaptureButton();
    });
}

// Watch for URL changes and re-inject
let lastUrl = window.location.href;
let lastJobId = getJobId();
let injectionTimeout;

const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    const currentJobId = getJobId();

    if (currentUrl !== lastUrl || currentJobId !== lastJobId) {
        console.log('🔄 Job changed, updating button...');
        lastUrl = currentUrl;
        lastJobId = currentJobId;

        const oldWrapper = document.querySelector('.jobflow-button-wrapper');
        if (oldWrapper) {
            oldWrapper.remove();
            console.log('🗑️ Removed old wrapper on URL change');
        }
    }

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

// =======================
// Debug Helper Functions (available in console)
// =======================

// Clear all saved jobs from storage
window.JobFlowClearSavedJobs = async function () {
    await chrome.storage.local.set({ savedJobs: [] });
    console.log('🗑️ All saved jobs cleared! Reload the page to see "Capture Job" buttons.');
};

// View all saved jobs
window.JobFlowViewSavedJobs = async function () {
    const { savedJobs = [] } = await chrome.storage.local.get('savedJobs');
    console.log('💾 Saved jobs:', savedJobs);
    console.log('📊 Total saved:', savedJobs.length);
    return savedJobs;
};

console.log('💡 Debug helpers available:');
console.log('   - JobFlowClearSavedJobs() - Clear all saved jobs');
console.log('   - JobFlowViewSavedJobs() - View all saved jobs');
