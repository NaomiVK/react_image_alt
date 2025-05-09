// src/components/ResultItem.tsx
import React, { useState } from 'react';
import { ResultItemProps as ResultItemComponentProps } from '../types'; // Renamed to avoid conflict
import { escapeHtml, formatDescriptionForHtml } from '../utils/domUtils';

const ResultItem: React.FC<ResultItemComponentProps> = ({ result, onCopy }) => {
  const [showFullEn, setShowFullEn] = useState(false);
  const [showFullFr, setShowFullFr] = useState(false);
  const [enCopied, setEnCopied] = useState(false);
  const [frCopied, setFrCopied] = useState(false);

  const pageIdentifier = result.pageNumber ? ` (Page ${result.pageNumber})` : '';
  const title = result.isPdf ? 'Description' : 'Alt Text';
  const MAX_PREVIEW_LENGTH = 200; // How much text to show before "Show More"

  const handleCopyClick = (text: string, lang: 'en' | 'fr') => {
    onCopy(text);
    if (lang === 'en') {
      setEnCopied(true);
      setTimeout(() => setEnCopied(false), 2000);
    } else {
      setFrCopied(true);
      setTimeout(() => setFrCopied(false), 2000);
    }
  };

  const renderCollapsibleText = (
    text: string,
    isFullShown: boolean,
    setShowFull: (show: boolean) => void
  ) => {
    if (!text && !result.error) return <p style={{ fontStyle: 'italic' }}>[Not available or being processed]</p>;
    if (!text && result.error) return null; // Error will be shown separately for the whole item

    const isLongText = result.isPdf && text.length > MAX_PREVIEW_LENGTH;

    if (isLongText) {
      return (
        <div className="collapsible-container">
          <div
            className="preview-text"
            style={{ display: isFullShown ? 'none' : 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: formatDescriptionForHtml(text.substring(0, MAX_PREVIEW_LENGTH) + '...') }}
          />
          <button type="button" className="toggle-button" onClick={() => setShowFull(!isFullShown)} style={{ fontSize: '0.8em', padding: '2px 5px', marginTop: '5px', display: 'block' }}>
            {isFullShown ? 'Show Less' : 'Show More'}
          </button>
          <div
            className="full-text formatted-description"
            style={{ display: isFullShown ? 'block' : 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: formatDescriptionForHtml(text) }}
          />
        </div>
      );
    }
    // For non-PDF or short PDF text, render directly
    return (
      <div
        className={result.isPdf ? 'formatted-description' : ''}
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} // Ensure text wraps
        dangerouslySetInnerHTML={{ __html: result.isPdf ? formatDescriptionForHtml(text) : `<p>${escapeHtml(text)}</p>`}}
      />
    );
  };

  // Determine overall item status message
  let statusMessage = null;
  if (result.error) {
    statusMessage = <p className="error-message" style={{ color: 'red', fontWeight: 'bold' }}>Error: {escapeHtml(result.error)}</p>;
  } else if (!result.processed) {
    statusMessage = <p style={{ fontStyle: 'italic', color: 'blue' }}><span className="spinner" style={{display: 'inline-block', width: '1em', height: '1em', borderWidth: '0.15em', marginRight: '5px'}}></span>Processing...</p>;
  }

  return (
    <div className="page-result" style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed #eee' }}>
      {/* Title for PDF pages */}
      {result.isPdf && <h5>Page {result.pageNumber}</h5>}

      {/* Image Preview */}
      {result.dataUrl && (
        <img
          src={result.dataUrl}
          alt={`Preview for ${escapeHtml(result.fileName)}${pageIdentifier}`}
          className="result-image"
          style={{ maxHeight: '200px', maxWidth: '100%', height:'auto', border: '1px solid #eee', marginBottom: '10px', display: 'block' }}
        />
      )}

      {/* Status Message (Error or Processing) */}
      {statusMessage}

      {/* English and French Text Columns (only if processed and no fatal error preventing text) */}
      {(result.processed || result.altTextEn || result.altTextFr) && !(!result.altTextEn && !result.altTextFr && result.error) && (
        <div className="result-columns" style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
          {/* English Column */}
          <div className="result-column" style={{flex: '1', minWidth: '250px'}}>
            <strong>English {title}:</strong>
            {renderCollapsibleText(result.altTextEn, showFullEn, setShowFullEn)}
            {result.altTextEn && (
              <button type="button" className="copy-button" onClick={() => handleCopyClick(result.altTextEn, 'en')} style={{ fontSize: '0.8em', padding: '2px 5px', marginTop: '5px' }}>
                {enCopied ? 'Copied!' : 'Copy Text'}
              </button>
            )}
          </div>

          {/* French Column */}
          <div className="result-column" style={{flex: '1', minWidth: '250px'}}>
            <strong>{title} Français:</strong>
            {renderCollapsibleText(result.altTextFr, showFullFr, setShowFullFr)}
            {result.altTextFr && !result.altTextFr.startsWith('[Translation Error') && (
              <button type="button" className="copy-button" onClick={() => handleCopyClick(result.altTextFr, 'fr')} style={{ fontSize: '0.8em', padding: '2px 5px', marginTop: '5px' }}>
                {frCopied ? 'Copied!' : 'Copy Text'}
              </button>
            )}
            {result.altTextFr && result.altTextFr.startsWith('[Translation Error') && (
                <p style={{color: 'darkorange', fontSize: '0.9em', fontStyle: 'italic'}}>{escapeHtml(result.altTextFr)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultItem;