// src/types/index.ts

// For individual image or PDF page results
export interface ResultItemData {
    id: string; // Unique identifier for React keys
    fileName: string; // Original file name, or file_page_N for PDFs
    pageNumber?: number; // For PDF pages
    dataUrl?: string; // base64 image data for preview
    altTextEn: string; // English alt text or description
    altTextFr: string; // French alt text or description
    error?: string; // Error message if processing failed
    processed: boolean; // Flag if API call has been made
    isPdf: boolean; // True if this item is a PDF page description
  }
  
  // Props for the ResultItem component (displays a single result)
  export interface ResultItemProps {
    result: ResultItemData;
    onCopy: (text: string) => void; // Function to handle copying text
  }
  
  // For OpenRouter API responses
  export interface OpenRouterResponse {
    id?: string;
    model?: string;
    choices?: {
      message?: {
        content?: string;
      };
    }[];
    error?: {
      message?: string;
      type?: string;
      code?: string;
      param?: string;
    };
    // Other possible fields
    object?: string;
    created?: number;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  }
  
  // For the shared state between ApiKeyEntry and ImageTool
  export interface SharedState {
    apiKey: string | null;
    isKeySubmitted: boolean;
  }
  export type UseSharedStateHook = () => [SharedState, (newState: Partial<SharedState>) => void];
  
  // Props for the ApiKeyEntry component
  export interface ApiKeyEntryProps {
    useSharedStateHook: UseSharedStateHook;
  }
  
  // Props for the ImageTool component
  export interface ImageToolProps {
    useSharedStateHook: UseSharedStateHook;
    pdfjsLib: any; // The imported PDF.js library object
  }