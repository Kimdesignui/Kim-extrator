import { GoogleGenAI } from "@google/genai";
import { ExtractedItem, DetectedClass } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartSelector = async (htmlSnippet: string, userDescription: string): Promise<string> => {
  try {
    // Increased from 15,000 to 100,000 for better context understanding
    const truncatedHtml = htmlSnippet.length > 100000 ? htmlSnippet.substring(0, 100000) + "...(truncated)" : htmlSnippet;

    const prompt = `
      I have an HTML snippet and I need a CSS Selector to extract specific elements.
      
      User's goal: "${userDescription}"
      
      Rules:
      1. Return ONLY the CSS selector string. Do not add markdown, quotes, or explanations.
      2. The selector should be specific enough to target the repeated items described.
      3. Use classes or tag combinations present in the HTML.
      
      HTML Snippet:
      \`\`\`html
      ${truncatedHtml}
      \`\`\`
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const selector = response.text?.trim();
    return selector || '';
  } catch (error) {
    console.error("Gemini Selector Error:", error);
    throw new Error("Failed to generate selector. Please try manual entry.");
  }
};

export const selectBestClassFromList = async (candidates: DetectedClass[]): Promise<string> => {
    try {
        const candidateString = candidates.map(c => `- Selector: "${c.className}" (Found ${c.count} times)`).join('\n');
        
        const prompt = `
        I have analyzed an HTML page and found the following frequent CSS selectors for images.
        Help me pick the single best selector that likely represents the "Main Product Image" or "Article Thumbnail".
        
        Candidates:
        ${candidateString}
        
        Rules:
        1. Ignore selectors that look like icons, logos, avatars, user profiles, or tiny utility classes (like .w-full, .block).
        2. Prefer selectors with specific names like 'product', 'thumbnail', 'card', 'item', 'gallery'.
        3. Return ONLY the selector string. Nothing else.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return response.text?.trim() || '';
    } catch (error) {
        console.error("Gemini Best Class Error:", error);
        return "";
    }
};

export const extractFigmaData = async (htmlSnippet: string): Promise<ExtractedItem[]> => {
  if (!htmlSnippet.trim()) return [];

  try {
    // CRITICAL FIX: Increased limit from 30,000 to 800,000 characters.
    // Multi-page extraction requires significantly more context. 
    // Gemini 1.5 Flash has a ~1M token window, so 800k chars is safe.
    const truncatedHtml = htmlSnippet.length > 800000 ? htmlSnippet.substring(0, 800000) + "...(truncated)" : htmlSnippet;

    const prompt = `
Role: Bạn là một Web Scraper AI có khả năng tự động nhận diện cấu trúc danh sách (Pattern Recognition).

Nhiệm vụ: Trích xuất toàn bộ sản phẩm từ dữ liệu HTML được cung cấp.

Quy trình thực hiện (Bí kíp số 3 Automation):
1. Định vị Vùng chứa (Container Discovery):
   - Trước khi bóc tách, hãy quét toàn bộ HTML để tìm thẻ cha (thường là <ul>, <ol>, hoặc <div>) có chứa số lượng thẻ con lặp lại nhiều nhất (các thẻ có class giống nhau như "product", "item", "post").
   - Cô lập dữ liệu: Chỉ tập trung vào nội dung bên trong vùng chứa này. Bỏ qua hoàn toàn Header, Footer, Sidebar và các Menu điều hướng.

2. Truy quét Lazy Load (Dành cho WordPress):
   - Đối với ảnh, không chỉ nhìn thẻ src. Phải kiểm tra: data-lazy-src, data-src, srcset, data-original.
   - Nếu thấy srcset, hãy chọn link cuối cùng (thường là ảnh to nhất).

3. Xử lý URL (Image Cleaning):
   - Xóa bỏ các hậu tố kích thước của WordPress (ví dụ: -300x400.jpg, -scaled.jpg, ?w=...) để lấy link ảnh gốc.
   - Nếu link là tương đối, hãy giữ nguyên, tôi sẽ xử lý sau.

Đầu ra (Bắt buộc):
   - Trả về duy nhất một bảng Markdown.
   - Cột 1: BookName (Tên sản phẩm sạch, không kèm ký tự rác).
   - Cột 2: #image (Link ảnh đã làm sạch, chất lượng cao nhất).

HTML Content:
\`\`\`html
${truncatedHtml}
\`\`\`
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text || '';
    return parseMarkdownTable(text);

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("AI extraction failed.");
  }
};

const parseMarkdownTable = (markdown: string): ExtractedItem[] => {
  const lines = markdown.split('\n');
  const items: ExtractedItem[] = [];
  let isTableBody = false;
  let count = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect Header
    if (trimmed.includes('BookName') && trimmed.includes('#image')) {
      continue;
    }
    // Detect Separator
    if (trimmed.includes('---') && trimmed.includes('|')) {
      isTableBody = true;
      continue;
    }

    if (isTableBody && trimmed.startsWith('|')) {
      // Split by pipe and remove empty strings from ends
      const parts = trimmed.split('|').map(p => p.trim()).filter(p => p !== '');
      
      if (parts.length >= 2) {
        count++;
        items.push({
          id: count,
          name: parts[0],
          src: parts[1],
          href: '' // AI mode focuses on Name/Image per prompt
        });
      }
    }
  }
  return items;
};