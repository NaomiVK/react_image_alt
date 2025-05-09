// src/pdfLoader.ts
// This file is responsible for loading the PDF.js library

// Define a type for the PDF.js library
interface PdfjsLib {
  getDocument: (source: any) => any;
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  version: string;
  [key: string]: any;
}

// Extend the Window interface to include pdfjsLib
declare global {
  interface Window {
    pdfjsLib?: PdfjsLib;
  }
}

// Function to wait for PDF.js to be loaded from CDN
function waitForPdfJs(maxWaitTime = 5000): Promise<PdfjsLib> {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    function checkPdfJs() {
      // If PDF.js is loaded, resolve with it
      if (window.pdfjsLib && typeof window.pdfjsLib.getDocument === 'function') {
        console.log('PDF.js found in window object, version:', window.pdfjsLib.version);
        return resolve(window.pdfjsLib);
      }
      
      // If we've waited too long, reject
      if (Date.now() - startTime > maxWaitTime) {
        return reject(new Error('Timeout waiting for PDF.js to load'));
      }
      
      // Otherwise, check again in 100ms
      setTimeout(checkPdfJs, 100);
    }
    
    // Start checking
    checkPdfJs();
  });
}

// Load PDF.js and return it
export async function loadPdfJs(): Promise<PdfjsLib> {
  try {
    // Wait for PDF.js to be loaded from the CDN via fix-pdf-issue.js
    const pdfjsLib = await waitForPdfJs();
    
    // Ensure worker source is set
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    
    console.log('PDF.js loaded successfully');
    return pdfjsLib;
  } catch (error) {
    console.error('Error loading PDF.js:', error);
    throw error;
  }
}