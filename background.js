// JobFlow Background Service Worker
// Handles OAuth2 authentication, job queue management, and Google Sheets API calls

const SPREADSHEET_ID = '1pZRhmdjj8g3e9BKjtxiHTrEEqyl9goGfagGdxWRLpAE';
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// State management
let authToken = null;

// =======================
// Authentication with Google OAuth2
// =======================

async function getAuthToken(interactive = false) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        console.error('Auth error:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        authToken = token;
        resolve(token);
      }
    });
  });
}

async function removeAuthToken() {
  if (authToken) {
    return new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({ token: authToken }, () => {
        authToken = null;
        resolve();
      });
    });
  }
}

// =======================
// Google Sheets API Integration
// =======================

async function appendToGoogleSheets(jobData) {
  try {
    // Ensure we have a valid token
    if (!authToken) {
      await getAuthToken(true);
    }

    const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`;

    // Format data as a row
    const row = [
      jobData.title || '',
      jobData.company || '',
      jobData.location || '',
      jobData.salary || '',
      jobData.url || '',
      jobData.date || new Date().toISOString().split('T')[0],
      jobData.status || 'Saved',
      jobData.notes || ''
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'Sheet1!A1',
        majorDimension: 'ROWS',
        values: [row]
      })
    });

    if (response.status === 401) {
      // Token expired, refresh and retry
      await removeAuthToken();
      await getAuthToken(true);
      return appendToGoogleSheets(jobData); // Retry
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sheets API error: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Job saved to Google Sheets:', result);
    return { success: true, result };

  } catch (error) {
    console.error('❌ Error saving to Google Sheets:', error);
    throw error;
  }
}

// =======================
// Queue Management (Offline Support)
// =======================

async function saveJobToQueue(jobData) {
  const queueItem = {
    id: `job_${Date.now()}`,
    data: jobData,
    status: 'pending',
    timestamp: Date.now(),
    retries: 0
  };

  const { queue = [] } = await chrome.storage.local.get('queue');
  queue.push(queueItem);
  await chrome.storage.local.set({ queue });

  console.log('📋 Job added to queue:', queueItem);
  return queueItem;
}

async function syncQueue() {
  const { queue = [] } = await chrome.storage.local.get('queue');
  const pendingJobs = queue.filter(item => item.status === 'pending');

  console.log(`🔄 Syncing ${pendingJobs.length} pending jobs...`);

  for (const item of pendingJobs) {
    try {
      await appendToGoogleSheets(item.data);

      // Mark as synced
      item.status = 'synced';
      item.syncedAt = Date.now();

      // Update queue
      const updatedQueue = queue.map(q => q.id === item.id ? item : q);
      await chrome.storage.local.set({ queue: updatedQueue });

      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon128.png',
        title: 'JobFlow - Job Saved!',
        message: `"${item.data.title}" at ${item.data.company} saved to your tracker.`
      });

    } catch (error) {
      console.error(`Failed to sync job ${item.id}:`, error);
      item.retries = (item.retries || 0) + 1;

      // If too many retries, mark as failed
      if (item.retries >= 3) {
        item.status = 'failed';
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/icon128.png',
          title: 'JobFlow - Sync Failed',
          message: `Could not save "${item.data.title}". Please check your connection.`
        });
      }

      const updatedQueue = queue.map(q => q.id === item.id ? item : q);
      await chrome.storage.local.set({ queue: updatedQueue });
    }
  }

  // Clean up old synced items (keep last 50)
  const syncedItems = queue.filter(item => item.status === 'synced');
  if (syncedItems.length > 50) {
    const itemsToKeep = syncedItems.slice(-50);
    const pendingItems = queue.filter(item => item.status !== 'synced');
    await chrome.storage.local.set({ queue: [...pendingItems, ...itemsToKeep] });
  }
}

// =======================
// Message Handlers
// =======================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received message:', message);

  if (message.action === 'SAVE_JOB') {
    (async () => {
      try {
        // Save to queue first (for resilience)
        await saveJobToQueue(message.data);

        // Attempt immediate sync
        await syncQueue();

        sendResponse({ success: true });
      } catch (error) {
        console.error('Error handling SAVE_JOB:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep channel open for async response
  }

  if (message.action === 'GET_AUTH_STATUS') {
    (async () => {
      try {
        await getAuthToken(false);
        sendResponse({ authenticated: !!authToken });
      } catch (error) {
        sendResponse({ authenticated: false });
      }
    })();
    return true;
  }

  if (message.action === 'REQUEST_AUTH') {
    (async () => {
      try {
        await getAuthToken(true);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.action === 'GET_QUEUE_STATUS') {
    (async () => {
      const { queue = [] } = await chrome.storage.local.get('queue');
      const stats = {
        total: queue.length,
        pending: queue.filter(q => q.status === 'pending').length,
        synced: queue.filter(q => q.status === 'synced').length,
        failed: queue.filter(q => q.status === 'failed').length
      };
      sendResponse(stats);
    })();
    return true;
  }

  if (message.action === 'SYNC_QUEUE') {
    (async () => {
      try {
        await syncQueue();
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
});

// =======================
// Periodic Sync with Alarms
// =======================

chrome.alarms.create('syncQueue', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncQueue') {
    console.log('⏰ Periodic sync triggered');
    syncQueue();
  }
});

// =======================
// Extension Lifecycle
// =======================

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('🎉 JobFlow installed! Opening setup...');
    // You can open an onboarding page here if needed
  }
});

console.log('🚀 JobFlow Background Service Worker running');
