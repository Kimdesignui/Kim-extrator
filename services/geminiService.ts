import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartSelector = async (htmlSnippet: string, userDescription: string): Promise<string> => {
  try {
    // Truncate HTML to avoid token limits if it's massive, 
    // though Gemini Flash handles large context well. 
    // Keeping it reasonable ensures speed.
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
