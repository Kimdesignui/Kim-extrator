import { ExtractionMode, ExtractedItem, ParseConfig, ExtractionResult, DetectedClass } from '../types';

// Helper: Clean HTML to remove garbage (scripts, styles) and get pure content
// This is crucial for WordPress sites to reduce token usage and noise for AI
const cleanHtmlContent = (rawHtml: string): string => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // Remove garbage tags that AI doesn't need
    // Removing 'noscript' is important because sometimes it contains fallback images that confuse the extractor
    doc.querySelectorAll('script, style, noscript, iframe, svg, link[rel="stylesheet"]').forEach(el => el.remove());

    // Return the clean body HTML
    // We trim it to ensure no leading/trailing whitespace issues
    return doc.body.innerHTML.trim();
  } catch (e) {
    console.warn("HTML cleaning failed, returning raw content", e);
    return rawHtml;
  }
};

// Robust function to fetch HTML from URL via multiple Proxy services
export const fetchHtmlFromUrl = async (url: string): Promise<string> => {
  const cleanUrl = url.trim();
  
  // Basic validation
  if (!cleanUrl.toLowerCase().startsWith('http')) {
    throw new Error("URL phải bắt đầu bằng http:// hoặc https://");
  }

  // Helper to fetch with timeout
  const fetchWithTimeout = async (resource: string) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(new Error("Request timed out after 15s")), 15000); // Increased to 15s
    try {
      const response = await fetch(resource, { signal: controller.signal });
      clearTimeout(id);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  const errors: string[] = [];
  let fetchedHtml = '';

  // Strategy 1: AllOrigins (Returns JSON { contents: string })
  // Usually the most reliable for text content and handles CORS well
  if (!fetchedHtml) {
    try {
      const response = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`);
      const data = await response.json();
      if (data.contents) fetchedHtml = data.contents;
    } catch (e: any) {
      console.warn("Primary proxy (AllOrigins) failed", e.message);
      errors.push(`AllOrigins: ${e.message}`);
    }
  }

  // Strategy 2: CorsProxy.io (Returns Raw HTML)
  // Good for direct HTML fetching
  if (!fetchedHtml) {
    try {
      const response = await fetchWithTimeout(`https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`);
      const text = await response.text();
      if (text && text.length > 50) fetchedHtml = text;
    } catch (e: any) {
      console.warn("Secondary proxy (CorsProxy) failed", e.message);
      errors.push(`CorsProxy: ${e.message}`);
    }
  }

  // Strategy 3: CodeTabs (Returns Raw HTML)
  if (!fetchedHtml) {
    try {
      const response = await fetchWithTimeout(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(cleanUrl)}`);
      const text = await response.text();
      if (text && text.length > 50) fetchedHtml = text;
    } catch (e: any) {
      console.warn("Tertiary proxy (CodeTabs) failed", e.message);
      errors.push(`CodeTabs: ${e.message}`);
    }
  }

  // Strategy 4: ThingProxy (Backup)
  if (!fetchedHtml) {
    try {
      const response = await fetchWithTimeout(`https://thingproxy.freeboard.io/fetch/${cleanUrl}`);
      const text = await response.text();
      if (text && text.length > 50) fetchedHtml = text;
    } catch (e: any) {
      console.warn("Quaternary proxy (ThingProxy) failed", e.message);
      errors.push(`ThingProxy: ${e.message}`);
    }
  }

  if (fetchedHtml) {
    // Apply the cleaning logic requested
    return cleanHtmlContent(fetchedHtml);
  }

  throw new Error(`Không thể tải trang web này. Có thể do chặn Proxy hoặc Timeout.\nChi tiết lỗi: ${errors.join(' | ')}.\nGiải pháp: Hãy mở trang web, nhấn Ctrl+U, copy toàn bộ mã nguồn và dán vào ô bên dưới.`);
};

// Function to scan HTML and find potential image classes
export const scanImageClasses = (html: string): DetectedClass[] => {
  if (!html.trim()) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const imgs = doc.querySelectorAll('img');
  
  const classMap = new Map<string, { count: number, type: 'img' | 'parent', example: string }>();

  imgs.forEach(img => {
    // 1. Check classes on the <img> tag itself
    if (img.className && typeof img.className === 'string') {
      const classes = img.className.split(/\s+/).filter(c => c.length > 2); // Filter short/garbage classes
      classes.forEach(cls => {
        const key = `img.${cls}`;
        const current = classMap.get(key) || { count: 0, type: 'img', example: img.src };
        classMap.set(key, { ...current, count: current.count + 1 });
      });
    }

    // 2. Check classes on the immediate parent (often a wrapper like .product-image)
    const parent = img.parentElement;
    if (parent && parent.className && typeof parent.className === 'string') {
      const classes = parent.className.split(/\s+/).filter(c => c.length > 2);
      classes.forEach(cls => {
        const key = `.${cls} img`; // Selector syntax for parent > img
        const current = classMap.get(key) || { count: 0, type: 'parent', example: img.src };
        classMap.set(key, { ...current, count: current.count + 1 });
      });
    }
  });

  // Convert map to array and sort by frequency
  return Array.from(classMap.entries())
    .map(([className, data]) => ({
      className: className, // This is already in selector format (e.g. "img.my-class" or ".wrapper img")
      count: data.count,
      type: data.type,
      example: data.example
    }))
    .sort((a, b) => b.count - a.count) // Descending order
    .slice(15); // Take top 15 most frequent
};

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