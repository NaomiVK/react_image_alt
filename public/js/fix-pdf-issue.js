// This script ensures PDF.js is properly loaded and configured
// It's included directly in the HTML to avoid Vite import issues

// Load PDF.js directly from CDN
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing PDF.js fix...');
  
  // Function to create the hidden canvas if it doesn't exist
  function ensureCanvasExists() {
    let canvas = document.getElementById('pdf-canvas');
    if (!canvas) {
      console.log('Creating hidden canvas for PDF rendering');
      canvas = document.createElement('canvas');
      canvas.id = 'pdf-canvas';
      canvas.width = 1000;
      canvas.height = 1000;
      canvas.style.display = 'none';
      canvas.style.position = 'absolute';
      canvas.style.top = '-9999px';
      canvas.style.left = '-9999px';
      document.body.appendChild(canvas);
    }
    return canvas;
  }
  
  // Create the canvas element
  const canvas = ensureCanvasExists();
  
  // If PDF.js is already loaded, just ensure the worker is set
  if (window.pdfjsLib) {
    console.log('PDF.js already loaded, version:', window.pdfjsLib.version);
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    return;
  }
  
  // Load PDF.js from CDN
  console.log('Loading PDF.js from CDN...');
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  script.onload = function() {
    console.log('PDF.js loaded successfully, version:', window.pdfjsLib.version);
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    // Test PDF.js functionality
    console.log('PDF.js getDocument function available:', typeof window.pdfjsLib.getDocument === 'function');
    console.log('PDF.js GlobalWorkerOptions available:', typeof window.pdfjsLib.GlobalWorkerOptions === 'object');
  };
  script.onerror = function(error) {
    console.error('Failed to load PDF.js:', error);
  };
  document.head.appendChild(script);
});