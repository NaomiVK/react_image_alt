// src/utils/domUtils.ts

export function escapeHtml(unsafe: string | undefined | null): string {
    if (typeof unsafe !== 'string') return '';
    return unsafe
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "'");
  }
  
  // This function prepares text (especially PDF descriptions) for safe HTML rendering
  export function formatDescriptionForHtml(text: string | undefined | null): string {
    if (!text) return '';
    let formatted = escapeHtml(text); // Always escape first
  
    // Convert explicit double newlines to paragraph breaks, single newlines to <br>
    formatted = formatted.replace(/\n\s*\n/g, '</p><p>');
    formatted = formatted.replace(/\n/g, '<br />');
  
    // Basic wrapping if it doesn't seem to have paragraphs already
    if (!formatted.match(/<\/?(p|ul|ol|h[1-4])/i) && formatted.trim() !== '') {
      formatted = `<p>${formatted}</p>`;
    }
    // Remove any empty paragraphs that might have been created
    formatted = formatted.replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, '');
    return formatted;
  }
  
  // Function to update all relevant links on the page with the API key
  export function updateLinksWithApiKey(apiKey: string | null) {
    document.querySelectorAll('a[href]').forEach(linkElement => {
      const link = linkElement as HTMLAnchorElement;
      let href = link.getAttribute('href');
  
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return; // Skip special links (local anchors, mailto, etc.)
      }
  
      try {
        // Resolve the link's URL relative to the current page's location
        const linkUrl = new URL(href, window.location.href);
  
        // Only update links that point to the same website origin
        if (linkUrl.origin !== window.location.origin) {
          return;
        }
  
        const existingParams = new URLSearchParams(linkUrl.search);
        if (apiKey) {
          existingParams.set('key', apiKey); // Add or update the 'key' parameter
        } else {
          existingParams.delete('key'); // Remove 'key' if apiKey is null
        }
  
        let newQueryString = existingParams.toString();
        // Reconstruct the href with the updated query string
        linkUrl.search = newQueryString ? `?${newQueryString}` : '';
        link.setAttribute('href', linkUrl.href);
  
      } catch (e) {
        // Fallback for very simple relative paths that URL constructor might struggle with directly
        // This is less robust but can handle simple cases like "other-page.html"
        if (!href.match(/^(https?:|#|mailto:|tel:|javascript:|\/\/)/)) {
          try {
            let [basePart, queryAndHash] = href.split('?');
            let hashPart = '';
            let queryPart = queryAndHash || '';
  
            if (queryPart.includes('#')) {
              [queryPart, hashPart] = queryPart.split('#');
              hashPart = '#' + hashPart;
            }
            
            const oldParams = new URLSearchParams(queryPart);
            if (apiKey) {
              oldParams.set('key', apiKey);
            } else {
              oldParams.delete('key');
            }
            
            let newQueryString = oldParams.toString();
            const finalHref = basePart + (newQueryString ? '?' + newQueryString : '') + hashPart;
            link.setAttribute('href', finalHref);
          } catch (e2) {
            console.warn(`Could not parse or update relative link href: ${href}`, e2);
          }
        } else {
          console.warn(`Could not parse or update link href: ${href}`, e);
        }
      }
    });
  }