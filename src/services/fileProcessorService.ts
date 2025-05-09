// src/services/fileProcessorService.ts

// Max dimensions for resizing images (especially for vision APIs)
const MAX_WIDTH = 1024;
const MAX_HEIGHT = 1024;

// Converts a File object to a base64 data URL string
export async function fileToDataURL(file: File): Promise<string> {
  if (!file || !(file instanceof File)) {
    console.error('Invalid file provided to fileToDataURL');
    throw new Error('Invalid file provided');
  }
  
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('File reading timed out after 30 seconds'));
      }, 30000);
      
      reader.onload = () => {
        clearTimeout(timeout);
        
        if (!reader.result || typeof reader.result !== 'string' || !reader.result.startsWith('data:')) {
          console.error('FileReader produced invalid data URL');
          reject(new Error('Invalid data URL generated'));
          return;
        }
        
        resolve(reader.result as string);
      };
      
      reader.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Error reading file:', error);
        reject(error || new Error('Unknown error reading file'));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Unexpected error in fileToDataURL:', error);
      reject(error);
    }
  });
}

// Resizes an image from a data URL if it exceeds max dimensions
export async function resizeImage(dataUrl: string): Promise<string> {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
        console.error('Invalid data URL provided to resizeImage');
        return ''; // Return empty string instead of throwing to avoid breaking the process
    }
    
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            
            // Set timeout to prevent hanging
            const timeout = setTimeout(() => {
                reject(new Error('Image loading timed out after 10 seconds'));
            }, 10000);
            
            img.onload = () => {
                clearTimeout(timeout);
                
                try {
                    let { width, height } = img;
                    if (!width || !height || width <= 0 || height <= 0) {
                        console.warn('Invalid image dimensions:', width, height);
                        resolve(dataUrl); // Return original if dimensions are invalid
                        return;
                    }
                    
                    const aspectRatio = width / height;
                    
                    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                        if (width > height) { // Landscape or square
                            if (width > MAX_WIDTH) {
                                width = MAX_WIDTH;
                                height = width / aspectRatio;
                            }
                        } else { // Portrait
                            if (height > MAX_HEIGHT) {
                                height = MAX_HEIGHT;
                                width = height * aspectRatio;
                            }
                        }
                        // Final check if the other dimension is still too large after first adjustment
                        if (width > MAX_WIDTH) {
                            width = MAX_WIDTH;
                            height = width / aspectRatio;
                        }
                        if (height > MAX_HEIGHT) {
                            height = MAX_HEIGHT;
                            width = height * aspectRatio;
                        }
                    }
                    
                    width = Math.round(width);
                    height = Math.round(height);
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    
                    if (!ctx) {
                        console.error('Could not get canvas context for resizing');
                        resolve(dataUrl); // Return original if context creation fails
                        return;
                    }
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    
                    if (!resizedDataUrl || !resizedDataUrl.startsWith('data:')) {
                        console.warn('Canvas toDataURL returned invalid data');
                        resolve(dataUrl); // Return original if resizing fails
                    } else {
                        resolve(resizedDataUrl);
                    }
                } catch (drawError) {
                    console.error('Error during image resizing:', drawError);
                    resolve(dataUrl); // Return original if resizing fails
                }
            };
            
            img.onerror = (error) => {
                clearTimeout(timeout);
                console.error('Image loading failed for resizing:', error);
                resolve(dataUrl); // Return original if loading fails
            };
            
            img.src = dataUrl;
        } catch (error) {
            console.error('Unexpected error in resizeImage:', error);
            resolve(dataUrl); // Return original if any unexpected error occurs
        }
    });
}

// Processes a PDF file, extracting each page as a resized image data URL
export async function processPdf(
  pdfjsLibInstance: any, // The imported PDF.js library
  file: File,
  onPageProcessed: (pageNumber: number, totalPages: number, dataUrl: string) => void // Callback for progress
): Promise<string[]> {
  const dataUrls: string[] = [];
  
  try {
    // Validate inputs
    if (!file) {
      throw new Error("Invalid file provided to processPdf");
    }
    
    if (!pdfjsLibInstance || !pdfjsLibInstance.getDocument) {
      throw new Error("PDF.js library is not correctly loaded or provided.");
    }
    
    // Get file data
    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("Failed to read PDF file data");
    }
    
    // Load PDF document
    const loadingTask = pdfjsLibInstance.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    if (!pdf) {
      throw new Error("Failed to load PDF document");
    }
    
    const totalPages = pdf.numPages;
    if (totalPages <= 0) {
      throw new Error("PDF document contains no pages");
    }
    
    // Get the hidden canvas from the HTML (ensure it exists)
    const canvasElement = document.getElementById('pdf-canvas') as HTMLCanvasElement;
    if (!canvasElement) {
      throw new Error("Canvas element #pdf-canvas not found in HTML. It's needed for PDF rendering.");
    }
    
    const context = canvasElement.getContext('2d');
    if (!context) {
      throw new Error("Could not get 2D context from #pdf-canvas.");
    }
    
    // Process each page
    for (let i = 1; i <= totalPages; i++) {
      try {
        const page = await pdf.getPage(i);
        if (!page) {
          console.warn(`Failed to get page ${i} from PDF`);
          continue;
        }
        
        // Render at a decent resolution for clarity, then resize
        const viewport = page.getViewport({ scale: 2.0 });
        canvasElement.height = viewport.height;
        canvasElement.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        const pageDataUrl = canvasElement.toDataURL('image/png'); // Render as PNG initially for quality
        if (!pageDataUrl) {
          console.warn(`Failed to get data URL for page ${i}`);
          continue;
        }
        
        const resizedPageDataUrl = await resizeImage(pageDataUrl); // Resize and convert to JPEG
        if (resizedPageDataUrl) {
          dataUrls.push(resizedPageDataUrl);
          onPageProcessed(i, totalPages, resizedPageDataUrl); // Notify caller of progress
        } else {
          console.warn(`Failed to resize image for page ${i}`);
        }
      } catch (pageError) {
        console.error(`Error processing page ${i}:`, pageError);
        // Continue with next page instead of failing the whole PDF
      }
    }
    
    if (dataUrls.length === 0) {
      throw new Error("Failed to extract any pages from the PDF");
    }
    
    return dataUrls;
  } catch (error) {
    console.error("Error in processPdf:", error);
    throw error; // Re-throw to let caller handle it
  }
}