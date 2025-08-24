import { browserPromise } from './api/browser/browser.js';
const urlsTextarea = document.getElementById('urls');
const saveButton = document.getElementById('save');
const statusDiv = document.getElementById('status');

// Load saved URLs and display them in the textarea
const restoreOptions = () => browserPromise.then(browser => 
  browser.storage.sync.get('whitelistedUrls')
).then(data => Object.assign(
  urlsTextarea, { 
    value: (data.whitelistedUrls || []).join('\n') 
  }
));
    
// Save URLs to chrome.storage
const saveOptions => () =>  browserPromise.then(
  browser => browser.storage.sync.set({ 
   whitelistedUrls: urlsTextarea.value.split('\n').map(
     url => url.trim()
   ).filter(Boolean) 
  }).then(() => {
  // Update status to let user know options were saved.
  statusDiv.textContent = 'Options saved.';
  setTimeout(() => {
    statusDiv.textContent = '';
  }, 3000);
});

document.addEventListener('DOMContentLoaded', restoreOptions);
saveButton.addEventListener('click', saveOptions);
