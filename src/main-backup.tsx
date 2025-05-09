// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import ApiKeyEntry from './components/ApiKeyEntry';
import ImageTool from './components/ImageTool';
// updateLinksWithApiKey might be in domUtils.ts, ensure it's imported if used directly here
import { updateLinksWithApiKey } from './utils/domUtils';


// Access pdfjsLib from the global window object
// The 'any' type assertion is used here because pdfjsLib is dynamically added to window
const pdfjsLib = (window as any).pdfjsLib;

// Configure PDF.js worker
// Note: We're not directly referencing the PDF.js files here to avoid Vite errors
// The PDF.js library is loaded via a script tag in the HTML
if (pdfjsLib && (pdfjsLib as any).GlobalWorkerOptions) {
  // The worker URL should be set in the HTML or by the PDF.js library itself
  console.log("PDF.js library detected on window object");
} else {
  // This error means the PDF.js library didn't load properly
  console.error(
    "pdfjsLib not found on window object or GlobalWorkerOptions missing. " +
    "PDF processing will fail. Ensure the PDF.js script tag is in your HTML and loads " +
    "BEFORE the React application script."
  );
}

// --- Shared State Logic (as defined previously) ---
interface SharedState { /* ... */ apiKey: string | null; isKeySubmitted: boolean; }
const globalImageToolState: SharedState = { /* ... */ apiKey: null, isKeySubmitted: false, };
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

const apiKeyElement = document.getElementById('api-key-entry');
if (apiKeyElement) {
  ReactDOM.createRoot(apiKeyElement).render(
    <React.StrictMode>
      <ApiKeyEntry useSharedStateHook={useSharedGlobalState} />
    </React.StrictMode>
  );
} else { /* console.warn as before */ }

const toolAreaElement = document.getElementById('tool-area');
if (toolAreaElement) {
  ReactDOM.createRoot(toolAreaElement).render(
    <React.StrictMode>
      {/* Pass the globally acquired pdfjsLib to ImageTool */}
      <ImageTool useSharedStateHook={useSharedGlobalState} pdfjsLib={pdfjsLib} />
    </React.StrictMode>
  );
} else { /* console.warn as before */ }