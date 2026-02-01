// Quick OAuth Diagnostic Script
// Run this in the Chrome DevTools Console (chrome://extensions -> Inspect views)

console.log('=== OAuth Diagnostic ===');

// Check manifest
chrome.runtime.getManifest().then(manifest => {
    console.log('Extension ID:', chrome.runtime.id);
    console.log('OAuth Client ID:', manifest.oauth2?.client_id);
    console.log('OAuth Scopes:', manifest.oauth2?.scopes);
});

// Try to get auth token
chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (chrome.runtime.lastError) {
        console.error('❌ Auth Error:', chrome.runtime.lastError.message);
        console.error('Full Error:', chrome.runtime.lastError);
    } else {
        console.log('✅ Token obtained:', token ? 'YES' : 'NO');
    }
});

console.log('=== End Diagnostic ===');
