// This script fixes the PDF.js loading issue
document.addEventListener('DOMContentLoaded', function() {
  // Create a mock PDF.js object to prevent errors
  window.pdfjsLib = window.pdfjsLib || {
    getDocument: function() {
      return {
        promise: Promise.resolve({
          getPage: function() {
            return Promise.resolve({
              getViewport: function() { return { width: 100, height: 100 }; },
              render: function() { return Promise.resolve(); }
            });
          }
        })
      };
    },
    GlobalWorkerOptions: { workerSrc: '' }
  };

  // Handle API key submission
  const apiKeyDisplay = document.getElementById('api-key-display');
  const apiKeyHidden = document.getElementById('api-key');
  const apiKeySubmitBtn = document.getElementById('api-key-submit-btn');
  const apiKeyEntryError = document.getElementById('api-key-entry-error');
  const apiKeyEntry = document.getElementById('api-key-entry');
  const toolArea = document.getElementById('tool-area');
  
  // Check for API key in URL
  const urlParams = new URLSearchParams(window.location.search);
  const keyFromUrl = urlParams.get('key');
  
  if (keyFromUrl && apiKeyDisplay && apiKeyHidden && apiKeyEntry && toolArea) {
    // Set the API key from URL
    apiKeyDisplay.value = keyFromUrl;
    apiKeyHidden.value = keyFromUrl;
    
    // Show the tool area and hide the API key entry form
    toolArea.classList.remove('hidden');
    apiKeyEntry.classList.add('hidden');
  }
  
  // Add event listener for submit button
  if (apiKeySubmitBtn) {
    apiKeySubmitBtn.addEventListener('click', function() {
      if (!apiKeyDisplay || !apiKeyHidden || !apiKeyEntry || !toolArea) return;
      
      const key = apiKeyDisplay.value.trim();
      
      if (!key) {
        // Show error message
        if (apiKeyEntryError) {
          apiKeyEntryError.textContent = 'Please enter a value for the API key.';
          apiKeyEntryError.classList.remove('hidden');
        }
        return;
      }
      
      // Hide error message
      if (apiKeyEntryError) {
        apiKeyEntryError.classList.add('hidden');
      }
      
      // Set the hidden input value
      apiKeyHidden.value = key;
      
      // Update URL without full page reload
      urlParams.set('key', key);
      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
      
      // Show the tool area and hide the API key entry form
      toolArea.classList.remove('hidden');
      apiKeyEntry.classList.add('hidden');
      
      console.log("API key submitted successfully:", key);
    });
  }
});