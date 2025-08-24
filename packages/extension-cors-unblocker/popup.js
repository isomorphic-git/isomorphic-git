import { browserPromise } from './api/browser/browser.js';
document.getElementById('options-btn').addEventListener('click', () => browserPromise.then((browser)=> {
  browser.runtime.openOptionsPage();
}));
  
  

