import { ExtractionMode, ExtractedItem, ParseConfig, ExtractionResult } from '../types';

export const parseHtml = (config: ParseConfig): ExtractionResult => {
  const { html, selector, mode, limit } = config;

  if (!html.trim()) {
    return { items: [], totalFound: 0, requested: limit, message: "Chưa nhập mã HTML." };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Base collection of elements based on the main selector
  let elements: NodeListOf<Element> | Element[] = [];
  
  try {
    // If the user didn't provide a selector, default based on mode or body
    const effectiveSelector = selector.trim() || (mode === ExtractionMode.LINKS ? 'a' : mode === ExtractionMode.IMAGES ? 'img' : 'body *');
    elements = doc.querySelectorAll(effectiveSelector);
  } catch (e) {
    return { items: [], totalFound: 0, requested: limit, message: "CSS Selector không hợp lệ." };
  }

  const extractedItems: ExtractedItem[] = [];
  let count = 0;

  // Helper to clean text and remove script/style tags
  const cleanText = (content: string | null | undefined, element?: Element) => {
    if (!content && !element) return '';
    
    // If we have the element, let's clone it and remove scripts/styles to get pure visible text
    if (element) {
      const clone = element.cloneNode(true) as Element;
      const scripts = clone.querySelectorAll('script, style, noscript');
      scripts.forEach(s => s.remove());
      return clone.textContent?.trim().replace(/\s+/g, ' ') || '';
    }

    return content?.trim().replace(/\s+/g, ' ') || '';
  };

  // Process elements based on mode
  for (let i = 0; i < elements.length; i++) {
    if (count >= limit) break;

    const el = elements[i];
    let item: ExtractedItem | null = null;

    if (mode === ExtractionMode.LINKS) {
      // If the selected element is an <a> tag
      if (el.tagName.toLowerCase() === 'a') {
        const anchor = el as HTMLAnchorElement;
        item = {
          id: count + 1,
          name: cleanText(null, anchor),
          href: anchor.getAttribute('href') || '',
        };
      } else {
        // If the selector pointed to a container, find the first <a> inside
        const anchor = el.querySelector('a');
        if (anchor) {
          item = {
            id: count + 1,
            name: cleanText(null, anchor),
            href: anchor.getAttribute('href') || '',
          };
        }
      }
    } else if (mode === ExtractionMode.IMAGES) {
      // If the selected element is an <img> tag
      if (el.tagName.toLowerCase() === 'img') {
        const img = el as HTMLImageElement;
        item = {
          id: count + 1,
          name: img.alt?.trim() || 'Hình ảnh',
          src: img.getAttribute('src') || '',
        };
      } else {
        // Find first img inside
        const img = el.querySelector('img');
        if (img) {
          item = {
            id: count + 1,
            name: img.alt?.trim() || 'Hình ảnh',
            src: img.getAttribute('src') || '',
          };
        }
      }
    } else if (mode === ExtractionMode.TEXT) {
       item = {
          id: count + 1,
          name: cleanText(null, el),
       };
    } else {
      // AUTO MODE: Try to grab everything relevant contextually
      const anchor = el.tagName.toLowerCase() === 'a' ? el as HTMLAnchorElement : el.querySelector('a');
      const img = el.tagName.toLowerCase() === 'img' ? el as HTMLImageElement : el.querySelector('img');
      
      const text = cleanText(null, el);
      const href = anchor ? anchor.getAttribute('href') || '' : undefined;
      const src = img ? img.getAttribute('src') || '' : undefined;

      // Only add if we found something useful
      if (text || href || src) {
        item = {
          id: count + 1,
          name: text,
          href: href,
          src: src
        };
      }
    }

    if (item) {
      extractedItems.push(item);
      count++;
    }
  }

  // Calculate actual total matches in the DOM (ignoring limit for stats)
  const totalFound = elements.length; 

  let message = "";
  if (extractedItems.length < limit) {
    message = `Tìm thấy ${extractedItems.length} mục, ít hơn yêu cầu ${limit}.`;
  } else {
    message = `Đã bóc tách thành công ${extractedItems.length} mục.`;
  }

  return {
    items: extractedItems,
    totalFound,
    requested: limit,
    message
  };
};
