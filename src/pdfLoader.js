// src/pdfLoader.js
// This file is responsible for loading the PDF.js library from the public directory
// and making it available globally

// Function to load a script dynamically
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = (error) => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// Load PDF.js and set the worker URL
export async function loadPdfJs() {
  try {
    // Load the PDF.js library
    await loadScript('/pdf.mjs');
    
    // Check if PDF.js was loaded successfully
    if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
      // Set the worker URL
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
      console.log('PDF.js loaded successfully and worker URL set');
      return window.pdfjsLib;
    } else {
      console.error('PDF.js library loaded but pdfjsLib not found on window object');
      return null;
    }
  } catch (error) {
    console.error('Error loading PDF.js:', error);
    return null;
  }
}