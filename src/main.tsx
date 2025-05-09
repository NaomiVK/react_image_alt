// src/main.tsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import ApiKeyEntry from './components/ApiKeyEntry';
import ImageTool from './components/ImageTool';
// updateLinksWithApiKey might be in domUtils.ts, ensure it's imported if used directly here
import { updateLinksWithApiKey } from './utils/domUtils';
// Import the PDF.js loader
import { loadPdfJs } from './pdfLoader';

// --- Shared State Logic (as defined previously) ---
interface SharedState { apiKey: string | null; isKeySubmitted: boolean; }
const globalImageToolState: SharedState = { apiKey: null, isKeySubmitted: false };
type Listener = () => void;
const listeners: Listener[] = [];
function notifySharedStateListeners() { listeners.forEach(listener => listener()); }
function useSharedGlobalState(): [SharedState, (newState: Partial<SharedState>) => void] {
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    React.useEffect(() => {
        const listener = () => forceUpdate();
        listeners.push(listener);
        return () => {
            const index = listeners.indexOf(listener);
            if (index > -1) listeners.splice(index, 1);
        };
    }, []);
    const setSharedState = (newState: Partial<SharedState>) => {
        const oldApiKey = globalImageToolState.apiKey;
        Object.assign(globalImageToolState, newState);
        if (newState.apiKey !== undefined && newState.apiKey !== oldApiKey) {
            updateLinksWithApiKey(newState.apiKey);
        }
        if (newState.isKeySubmitted && newState.apiKey && newState.apiKey !== oldApiKey) {
            updateLinksWithApiKey(newState.apiKey);
        }
        notifySharedStateListeners();
    };
    return [globalImageToolState, setSharedState];
}
// --- End Shared State Logic ---

// Create a wrapper component to handle PDF.js loading
const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Get shared state
  const [sharedState, setSharedState] = useSharedGlobalState();
  
  // Handle API key submission directly
  useEffect(() => {
    // Get references to DOM elements
    const apiKeyDisplay = document.getElementById('api-key-display') as HTMLInputElement;
    const apiKeyHidden = document.getElementById('api-key') as HTMLInputElement;
    const apiKeySubmitBtn = document.getElementById('api-key-submit-btn') as HTMLButtonElement;
    const apiKeyEntryError = document.getElementById('api-key-entry-error') as HTMLParagraphElement;
    const apiKeyEntry = document.getElementById('api-key-entry') as HTMLDivElement;
    const toolArea = document.getElementById('tool-area') as HTMLDivElement;
    
    // Check for API key in URL
    const urlParams = new URLSearchParams(window.location.search);
    const keyFromUrl = urlParams.get('key');
    
    if (keyFromUrl && apiKeyDisplay && apiKeyHidden && apiKeyEntry && toolArea) {
      // Set the API key from URL
      apiKeyDisplay.value = keyFromUrl;
      apiKeyHidden.value = keyFromUrl;
      
      // Update shared state
      setSharedState({ apiKey: keyFromUrl, isKeySubmitted: true });
      
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
        
        // Update shared state
        setSharedState({ apiKey: key, isKeySubmitted: true });
        
        // Update URL without full page reload
        urlParams.set('key', key);
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
        
        // Show the tool area and hide the API key entry form
        toolArea.classList.remove('hidden');
        apiKeyEntry.classList.add('hidden');
      });
    }
  }, []);

  // Load PDF.js on component mount
  useEffect(() => {
    const loadPdfJsLibrary = async () => {
      try {
        setIsLoading(true);
        await loadPdfJs();
        
        // Ensure PDF.js is available globally
        // The loadPdfJs function already sets window.pdfjsLib
        
        console.log("PDF.js library loaded successfully");
      } catch (error) {
        console.error("Failed to load PDF.js library:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPdfJsLibrary();
  }, []);

  return (
    <>
      {/* Only render the ImageTool component when PDF.js is loaded */}
      {!isLoading && (
        <ImageTool useSharedStateHook={useSharedGlobalState} pdfjsLib={window.pdfjsLib} />
      )}
    </>
  );
};

// Render the App component into the tool-area element
const toolAreaElement = document.getElementById('tool-area');
if (toolAreaElement) {
  ReactDOM.createRoot(toolAreaElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.warn("Tool area element not found");
}