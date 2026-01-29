import { GoogleGenAI } from "@google/genai";
import { ExtractedItem, DetectedClass } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartSelector = async (htmlSnippet: string, userDescription: string): Promise<string> => {
  try {
    const truncatedHtml = htmlSnippet.length > 15000 ? htmlSnippet.substring(0, 15000) + "...(truncated)" : htmlSnippet;

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
    const truncatedHtml = htmlSnippet.length > 30000 ? htmlSnippet.substring(0, 30000) + "...(truncated)" : htmlSnippet;

    const prompt = `
Role: Bạn là một chuyên gia bóc tách dữ liệu (Data Scraper) cao cấp, chuyên xử lý cấu hình cho Figma Sync.

Task: Trích xuất danh sách sản phẩm từ đoạn mã HTML được cung cấp bên dưới.

Extraction Rules:
1. Product Name: Tìm tên sản phẩm trong các thẻ h1, h2, h3 hoặc các thẻ có class chứa "title", "name".
2. Image URL: Đây là ưu tiên hàng đầu. Kiểm tra tất cả các thuộc tính sau của thẻ <img>: src, data-src, data-original, data-lazy-src, srcset.
   - Nếu thấy srcset, hãy phân tích và chọn link có độ phân giải cao nhất (thường là link cuối cùng hoặc có hậu tố lớn nhất như 2x, 3x).
   - Loại bỏ các icon nhỏ, avatar hoặc ảnh trang trí.
3. Cleanup: Loại bỏ các ký tự thừa, khoảng trắng dư và đảm bảo link ảnh là link trực tiếp.

Output Format: Trả về KẾT QUẢ DUY NHẤT là một bảng Markdown với đúng 2 cột tiêu đề: BookName và #image. Không giải thích gì thêm.

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