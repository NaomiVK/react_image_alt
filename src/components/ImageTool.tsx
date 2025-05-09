// src/components/ImageTool.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ImageToolProps, ResultItemData } from '../types';
import { getAltTextAndTranslation } from '../services/openRouterService';
import { fileToDataURL, processPdf, resizeImage } from '../services/fileProcessorService';
import ResultItem from './ResultItem';

const ImageTool: React.FC<ImageToolProps> = ({ useSharedStateHook, pdfjsLib }) => {
  const [sharedState] = useSharedStateHook();
  const { apiKey, isKeySubmitted } = sharedState;

  const [selectedVisionModel, setSelectedVisionModel] = useState<string>('qwen/qwen2.5-vl-32b-instruct:free');
  const [filesToProcessQueue, setFilesToProcessQueue] = useState<File[]>([]);
  const [processedResults, setProcessedResults] = useState<ResultItemData[]>([]);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [showProgress, setShowProgress] = useState<boolean>(false);

  // Handle file selection
  const handleFileSelectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    if (!apiKey || !isKeySubmitted) {
      alert("OpenRouter API Key is missing or not submitted. Please provide a key first.");
      if (event.target) event.target.value = ''; // Clear file input
      return;
    }
    
    setProcessedResults([]); // Clear previous results
    setFilesToProcessQueue(Array.from(event.target.files));
  };

  // Handle vision model change
  const handleVisionModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVisionModel(event.target.value);
    setProcessedResults([]);
    setFilesToProcessQueue([]);
    alert("Vision model changed. Please re-upload files if you want to process them with the new model.");
  };

  // Process files when queue changes
  useEffect(() => {
    if (filesToProcessQueue.length > 0 && apiKey && isKeySubmitted) {
      const runProcessing = async () => {
        setIsProcessing(true);
        setCurrentProgress(0);
        setProgressMessage('Initializing...');
        setShowProgress(true);
        
        let currentBatchResults: ResultItemData[] = [];

        for (let i = 0; i < filesToProcessQueue.length; i++) {
          const file = filesToProcessQueue[i];
          const fileIdPrefix = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          setProgressMessage(`Processing file ${i + 1} of ${filesToProcessQueue.length}: ${file.name}`);
          
          try {
            if (file.type.startsWith('image/')) {
              setCurrentProgress(((i + 0.2) / filesToProcessQueue.length) * 100);
              let dataUrl = await fileToDataURL(file);
              dataUrl = await resizeImage(dataUrl);
              
              const placeholderId = `${fileIdPrefix}-img`;
              currentBatchResults.push({
                id: placeholderId, fileName: file.name, dataUrl,
                altTextEn: '', altTextFr: '', processed: false, isPdf: false,
              });
              setProcessedResults([...currentBatchResults]);

              setCurrentProgress(((i + 0.6) / filesToProcessQueue.length) * 100);
              const apiResult = await getAltTextAndTranslation(apiKey, selectedVisionModel, dataUrl, file.name, false);
              
              const resultIdx = currentBatchResults.findIndex(r => r.id === placeholderId);
              if (resultIdx > -1) {
                currentBatchResults[resultIdx] = { ...currentBatchResults[resultIdx], ...apiResult, processed: true };
                setProcessedResults([...currentBatchResults]);
              }

            } else if (file.type === 'application/pdf') {
              if (!pdfjsLib) throw new Error("PDF.js library not available for PDF processing.");
              
              const pdfPageImageUrls = await processPdf(pdfjsLib, file, (pageNum, totalPages, _pageDataUrl) => {
                setProgressMessage(`Extracting PDF ${file.name}: Page ${pageNum} of ${totalPages}`);
                setCurrentProgress(((i + (0.2 * (pageNum / totalPages))) / filesToProcessQueue.length) * 100);
              });
              
              // Check if pdfPageImageUrls is valid
              if (!pdfPageImageUrls || !Array.isArray(pdfPageImageUrls) || pdfPageImageUrls.length === 0) {
                throw new Error("PDF processing failed: No pages were extracted");
              }

              for (let j = 0; j < pdfPageImageUrls.length; j++) {
                const pageDataUrl = pdfPageImageUrls[j];
                if (!pageDataUrl) {
                  console.warn(`Warning: Empty data URL for page ${j+1} of PDF ${file.name}`);
                  continue; // Skip this page
                }
                const pageFileName = `${file.name}`;
                const pageContextName = `${file.name} (Page ${j + 1})`;
                
                const placeholderId = `${fileIdPrefix}-page-${j + 1}`;
                currentBatchResults.push({
                  id: placeholderId, fileName: pageFileName, pageNumber: j + 1, dataUrl: pageDataUrl,
                  altTextEn: '', altTextFr: '', processed: false, isPdf: true,
                });
                setProcessedResults([...currentBatchResults]);

                setProgressMessage(`Analyzing PDF ${file.name}: Page ${j + 1} of ${pdfPageImageUrls.length}`);
                setCurrentProgress(((i + (0.2 + (0.7 * ((j+1) / pdfPageImageUrls.length)))) / filesToProcessQueue.length) * 100);

                const apiResult = await getAltTextAndTranslation(apiKey, selectedVisionModel, pageDataUrl, pageContextName, true);
                
                const resultIdx = currentBatchResults.findIndex(r => r.id === placeholderId);
                if (resultIdx > -1) {
                  currentBatchResults[resultIdx] = { ...currentBatchResults[resultIdx], ...apiResult, processed: true };
                  setProcessedResults([...currentBatchResults]);
                }
              }
            } else {
              throw new Error(`Unsupported file type: ${file.type}`);
            }
          } catch (error: any) {
            console.error(`Error processing file ${file.name}:`, error);
            currentBatchResults.push({
              id: fileIdPrefix, fileName: file.name, altTextEn: '', altTextFr: '',
              error: error.message || 'Unknown processing error', processed: true, isPdf: file.type === 'application/pdf'
            });
            setProcessedResults([...currentBatchResults]);
          }
          setCurrentProgress(((i + 1) / filesToProcessQueue.length) * 100);
        }
        
        setProgressMessage(`Processing Completed. ${currentBatchResults.filter(r => r.processed && !r.error).length} items analyzed.`);
        setCurrentProgress(100);
        setIsProcessing(false);
        
        // Hide progress after a delay
        setTimeout(() => {
          setShowProgress(false);
        }, 3000);
      };
      runProcessing();
    }
  }, [filesToProcessQueue, apiKey, isKeySubmitted, selectedVisionModel, pdfjsLib]);

  // Handle copy to clipboard
  const handleCopyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => { /* Success */ })
      .catch(err => console.error('Failed to copy text:', err));
  }, []);

  // Generate CSV data
  const generateCsvData = (finalResults: ResultItemData[]) => {
    if (finalResults.length === 0) {
      return null;
    }
    
    const headers = ['File Name', 'Page Number (for PDF)', 'Image Alt Text (English)', 'Image Alt Text (French)', 'PDF Description (English)', 'PDF Description (French)', 'Error'];
    const rows = finalResults.map(r => {
      const safeFileName = (r.fileName || '').replace(/"/g, '""');
      const pageNum = r.isPdf && r.pageNumber ? r.pageNumber.toString() : '';
      const altEn = !r.isPdf ? (r.altTextEn || '').replace(/"/g, '""') : '';
      const altFr = !r.isPdf ? (r.altTextFr || '').replace(/"/g, '""') : '';
      const descEn = r.isPdf ? (r.altTextEn || '').replace(/"/g, '""') : '';
      const descFr = r.isPdf ? (r.altTextFr || '').replace(/"/g, '""') : '';
      const errorMsg = (r.error || '').replace(/"/g, '""');
      return [`"${safeFileName}"`, `"${pageNum}"`, `"${altEn}"`, `"${altFr}"`, `"${descEn}"`, `"${descFr}"`, `"${errorMsg}"`];
    });
    
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(',') + '\n'
      + rows.map(e => e.join(',')).join('\n');

    return encodeURI(csvContent);
  };

  // Group results by file name
  const groupedResults: { [fileName: string]: ResultItemData[] } = {};
  processedResults.forEach(res => {
    if (!groupedResults[res.fileName]) {
      groupedResults[res.fileName] = [];
    }
    groupedResults[res.fileName].push(res);
  });

  // Only show if API key has been submitted
  if (!isKeySubmitted || !apiKey) {
    return null;
  }

  const csvData = generateCsvData(processedResults.filter(r => r.processed && !r.error));

  return (
    <div className="image-tool">
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="vision-model-select">Choose Vision Model:</label>
        <select
          id="vision-model-select"
          className="form-control"
          style={{ display: 'inline-block', width: 'auto', marginLeft: '10px' }}
          value={selectedVisionModel}
          onChange={handleVisionModelChange}
        >
          <option value="qwen/qwen2.5-vl-32b-instruct:free">Qwen 2.5 VL 32B (Free)</option>
          <option value="openai/gpt-4o-mini">OpenAI GPT-4o-mini</option>
        </select>
      </div>

      <fieldset>
        <legend>Choose image or PDF files</legend>
        <input
          type="file"
          id="file-uploader"
          name="files"
          multiple
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={handleFileSelectionChange}
        />
      </fieldset>

      {showProgress && (
        <div id="progress-area" style={{ marginTop: '20px' }}>
          <div className="spinner"></div>
          <span id="progress-text">{progressMessage}</span>
          <progress id="progress-bar" value={currentProgress} max="100" style={{ width: '100%' }}></progress>
        </div>
      )}

      <div id="results-display" style={{ marginTop: '30px' }}>
        {Object.entries(groupedResults).map(([fileName, items]) => (
          <div key={`group-${fileName}`} id={`result-${fileName.replace(/[^a-zA-Z0-9-_]/g, '-')}`} className="result-container">
            <h4>Results for: {fileName}</h4>
            {items
              .sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0))
              .map(item => (
                <ResultItem key={item.id} result={item} onCopy={handleCopyToClipboard} />
              ))
            }
            <hr style={{ borderTop: '2px solid #ccc', marginTop: '20px' }} />
          </div>
        ))}
      </div>

      <div id="csv-download-area" style={{ marginTop: '30px' }}>
        {csvData && (
          <a
            href={csvData}
            download="image_alt_texts_and_descriptions.csv"
            className="btn btn-primary"
            style={{
              marginTop: '10px',
              display: 'inline-block',
              padding: '8px 15px',
              textDecoration: 'none',
              backgroundColor: '#007bff',
              color: 'white',
              borderRadius: '4px'
            }}
          >
            Download Results as CSV
          </a>
        )}
      </div>
    </div>
  );
};

export default ImageTool;