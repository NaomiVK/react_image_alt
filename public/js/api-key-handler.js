// Simple script to handle API key submission
document.addEventListener('DOMContentLoaded', function() {
  // Get references to DOM elements
  const apiKeyDisplay = document.getElementById('api-key-display');
  const apiKeyHidden = document.getElementById('api-key');
  const apiKeySubmitBtn = document.getElementById('api-key-submit-btn');
  const apiKeyEntryError = document.getElementById('api-key-entry-error');
  const apiKeyEntry = document.getElementById('api-key-entry');
  const toolArea = document.getElementById('tool-area');
  
  // Check for API key in URL
  const urlParams = new URLSearchParams(window.location.search);
  const keyFromUrl = urlParams.get('key');
  
  if (keyFromUrl) {
    // Set the API key from URL
    apiKeyDisplay.value = keyFromUrl;
    apiKeyHidden.value = keyFromUrl;
    
    // Show the tool area and hide the API key entry form
    toolArea.classList.remove('hidden');
    apiKeyEntry.classList.add('hidden');
  }
  
  // Add event listener for submit button
  apiKeySubmitBtn.addEventListener('click', function() {
    const key = apiKeyDisplay.value.trim();
    
    if (!key) {
      // Show error message
      apiKeyEntryError.textContent = 'Please enter a value for the API key.';
      apiKeyEntryError.classList.remove('hidden');
      return;
    }
    
    // Hide error message
    apiKeyEntryError.classList.add('hidden');
    
    // Set the hidden input value
    apiKeyHidden.value = key;
    
    // Update URL without full page reload
    urlParams.set('key', key);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    
    // Show the tool area and hide the API key entry form
    toolArea.classList.remove('hidden');
    apiKeyEntry.classList.add('hidden');
  });
});