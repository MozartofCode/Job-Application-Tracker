// JobFlow Popup Script
// Handles popup interactions and displays extension status

const SPREADSHEET_ID = '1pZRhmdjj8g3e9BKjtxiHTrEEqyl9goGfagGdxWRLpAE';

// =======================
// DOM Elements
// =======================

const authStatus = document.getElementById('authStatus');
const statusText = document.getElementById('statusText');
const totalJobsEl = document.getElementById('totalJobs');
const pendingJobsEl = document.getElementById('pendingJobs');
const syncedJobsEl = document.getElementById('syncedJobs');
const openSheetBtn = document.getElementById('openSheetBtn');
const syncNowBtn = document.getElementById('syncNowBtn');
const authSection = document.getElementById('authSection');
const authBtn = document.getElementById('authBtn');
const helpLink = document.getElementById('helpLink');
const settingsLink = document.getElementById('settingsLink');

// =======================
// Initialize Popup
// =======================

async function init() {
    await checkAuthStatus();
    await updateStats();
    setupEventListeners();
}

// =======================
// Auth Status Check
// =======================

async function checkAuthStatus() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'GET_AUTH_STATUS' });

        if (response.authenticated) {
            authStatus.classList.add('connected');
            statusText.textContent = 'Connected';
            authSection.classList.add('hidden');
        } else {
            authStatus.classList.remove('connected');
            authStatus.classList.add('error');
            statusText.textContent = 'Not Connected';
            authSection.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        authStatus.classList.add('error');
        statusText.textContent = 'Error';
    }
}

// =======================
// Stats Update
// =======================

async function updateStats() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'GET_QUEUE_STATUS' });

        totalJobsEl.textContent = response.total || 0;
        pendingJobsEl.textContent = response.pending || 0;
        syncedJobsEl.textContent = response.synced || 0;

        // Animate numbers
        animateValue(totalJobsEl, 0, response.total || 0, 500);
        animateValue(pendingJobsEl, 0, response.pending || 0, 500);
        animateValue(syncedJobsEl, 0, response.synced || 0, 500);

    } catch (error) {
        console.error('Error fetching stats:', error);
        totalJobsEl.textContent = '0';
        pendingJobsEl.textContent = '0';
        syncedJobsEl.textContent = '0';
    }
}

// =======================
// Event Listeners
// =======================

function setupEventListeners() {
    openSheetBtn.addEventListener('click', openGoogleSheet);
    syncNowBtn.addEventListener('click', syncNow);
    authBtn.addEventListener('click', requestAuth);
    helpLink.addEventListener('click', openHelpPage);
    settingsLink.addEventListener('click', openSettings);
}

async function openGoogleSheet() {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;
    chrome.tabs.create({ url });
}

async function syncNow() {
    syncNowBtn.classList.add('loading');
    syncNowBtn.disabled = true;

    try {
        // Trigger sync in background
        await chrome.runtime.sendMessage({ action: 'SYNC_QUEUE' });

        // Wait a bit for sync to complete
        setTimeout(async () => {
            await updateStats();
            syncNowBtn.classList.remove('loading');
            syncNowBtn.disabled = false;

            // Show success feedback
            const originalText = syncNowBtn.innerHTML;
            syncNowBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Synced!
      `;

            setTimeout(() => {
                syncNowBtn.innerHTML = originalText;
            }, 2000);
        }, 1500);

    } catch (error) {
        console.error('Sync error:', error);
        syncNowBtn.classList.remove('loading');
        syncNowBtn.disabled = false;
    }
}

async function requestAuth() {
    authBtn.classList.add('loading');
    authBtn.disabled = true;

    try {
        const response = await chrome.runtime.sendMessage({ action: 'REQUEST_AUTH' });

        if (response.success) {
            await checkAuthStatus();
            await updateStats();
        } else {
            alert('Failed to authenticate. Please try again.');
        }
    } catch (error) {
        console.error('Auth error:', error);
        alert('Authentication failed. Please try again.');
    } finally {
        authBtn.classList.remove('loading');
        authBtn.disabled = false;
    }
}

function openHelpPage(e) {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/MozartofCode/Job-Application-Tracker#readme' });
}

function openSettings(e) {
    e.preventDefault();
    // TODO: Open settings page when implemented
    alert('Settings page coming soon!');
}

// =======================
// Utility Functions
// =======================

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// =======================
// Auto-refresh stats every 5 seconds
// =======================

setInterval(updateStats, 5000);

// =======================
// Initialize on load
// =======================

document.addEventListener('DOMContentLoaded', init);
