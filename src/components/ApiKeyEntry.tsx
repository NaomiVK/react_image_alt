// src/components/ApiKeyEntry.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ApiKeyEntryProps } from '../types'; // Your custom types

const ApiKeyEntry: React.FC<ApiKeyEntryProps> = ({ useSharedStateHook }) => {
  const [sharedState, setSharedState] = useSharedStateHook();
  const [localApiKey, setLocalApiKey] = useState('');
  const [error, setError] = useState('');
  
  // Refs to store event handlers for cleanup
  const inputHandlerRef = useRef<((e: Event) => void) | null>(null);
  const submitHandlerRef = useRef<(() => void) | null>(null);

  // On component mount, check for API key in URL or shared state and set up event listeners
  useEffect(() => {
    // Get references to DOM elements
    const apiKeyDisplay = document.getElementById('api-key-display') as HTMLInputElement | null;
    const apiKeySubmitBtn = document.getElementById('api-key-submit-btn') as HTMLButtonElement | null;
    const apiKeyErrorMsg = document.getElementById('api-key-entry-error') as HTMLParagraphElement | null;
    
    // Set up event listeners
    if (apiKeyDisplay) {
      // Set initial value if we have one
      if (localApiKey) {
        apiKeyDisplay.value = localApiKey;
      }
      
      // Add event listener for input changes
      const handleInput = (e: Event) => {
        const target = e.target as HTMLInputElement;
        console.log("Input changed:", target.value);
        setLocalApiKey(target.value);
        if (error) {
          setError('');
          if (apiKeyErrorMsg) {
            apiKeyErrorMsg.classList.add('hidden');
          }
        }
      };
      
      // Store handler in ref for cleanup
      inputHandlerRef.current = handleInput;
      
      apiKeyDisplay.addEventListener('input', handleInput);
    }
    
    // Set up submit button event listener
    if (apiKeySubmitBtn) {
      console.log("Found submit button, adding event listener");
      
      const handleClick = () => {
        console.log("Submit button clicked");
        handleSubmit();
      };
      
      // Store handler in ref for cleanup
      submitHandlerRef.current = handleClick;
      
      apiKeySubmitBtn.addEventListener('click', handleClick);
    } else {
      console.error("Submit button not found");
    }
    
    // Check for API key in URL
    const urlParams = new URLSearchParams(window.location.search);
    const keyFromUrl = urlParams.get('key');

    if (keyFromUrl) {
      setLocalApiKey(keyFromUrl);
      if (apiKeyDisplay) {
        apiKeyDisplay.value = keyFromUrl;
      }
      
      // Use setTimeout to ensure this runs after initial render
      setTimeout(() => {
        setSharedState({ apiKey: keyFromUrl, isKeySubmitted: true });
        console.log("API key set from URL:", keyFromUrl);
        
        // Show the tool area and hide the API key entry form
        const toolArea = document.getElementById('tool-area');
        const apiKeyEntry = document.getElementById('api-key-entry');
        if (toolArea) {
          toolArea.classList.remove('hidden');
        }
        if (apiKeyEntry) {
          apiKeyEntry.classList.add('hidden');
        }
      }, 0);
    } else if (sharedState.apiKey && sharedState.isKeySubmitted) {
      // If key already in shared state
      setLocalApiKey(sharedState.apiKey);
      if (apiKeyDisplay) {
        apiKeyDisplay.value = sharedState.apiKey;
      }
      
      // Show the tool area and hide the API key entry form
      const toolArea = document.getElementById('tool-area');
      const apiKeyEntry = document.getElementById('api-key-entry');
      if (toolArea) {
        toolArea.classList.remove('hidden');
      }
      if (apiKeyEntry) {
        apiKeyEntry.classList.add('hidden');
      }
    }
    
    // Cleanup event listeners
    return () => {
      if (apiKeyDisplay && inputHandlerRef.current) {
        apiKeyDisplay.removeEventListener('input', inputHandlerRef.current);
      }
      
      if (apiKeySubmitBtn && submitHandlerRef.current) {
        apiKeySubmitBtn.removeEventListener('click', submitHandlerRef.current);
      }
    };
  }, []);

  const handleSubmit = () => {
    console.log("handleSubmit called");
    
    // Get the API key directly from the input field
    const apiKeyDisplay = document.getElementById('api-key-display') as HTMLInputElement;
    const apiKeyErrorMsg = document.getElementById('api-key-entry-error') as HTMLParagraphElement;
    
    if (!apiKeyDisplay) {
      console.error("API key input field not found");
      return;
    }
    
    const key = apiKeyDisplay.value.trim();
    console.log("API key from input field:", key);
    console.log("Error message element:", apiKeyErrorMsg);
    
    if (!key) {
      console.log("No API key entered");
      setError('Please enter a value for the API key.');
      if (apiKeyErrorMsg) {
        apiKeyErrorMsg.textContent = 'Please enter a value for the API key.';
        apiKeyErrorMsg.classList.remove('hidden');
      }
      return;
    }
    
    // Clear error message
    console.log("API key is valid, clearing error");
    setError('');
    if (apiKeyErrorMsg) {
      apiKeyErrorMsg.classList.add('hidden');
    }

    // Update URL without full page reload
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('key', key);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    console.log("URL updated with API key");
    
    // Update shared state
    console.log("Setting API key from submit:", key);
    setSharedState({ apiKey: key, isKeySubmitted: true });
    
    // Show the tool area and hide the API key entry form
    const toolArea = document.getElementById('tool-area');
    const apiKeyEntry = document.getElementById('api-key-entry');
    console.log("Tool area element:", toolArea);
    console.log("API key entry element:", apiKeyEntry);
    
    if (toolArea) {
      console.log("Showing tool area");
      toolArea.classList.remove('hidden');
    } else {
      console.error("Tool area element not found");
    }
    
    if (apiKeyEntry) {
      console.log("Hiding API key entry form");
      apiKeyEntry.classList.add('hidden');
    } else {
      console.error("API key entry element not found");
    }
    
    // Force a re-render after a short delay
    setTimeout(() => {
      console.log("Shared state after submit:", sharedState);
    }, 100);
  };

  // This component doesn't render new DOM elements itself.
  // It finds and manipulates the existing HTML elements for the API key form.
  // So, it returns `null`.
  return null;
};

export default ApiKeyEntry;