import { GoogleGenerativeAI } from '@google/generative-ai';
import { CategorizationResult, Category } from '../types/index.js';
import { getCategories } from './supabase.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function categorizeContent(
  content: string,
  contentType: 'text' | 'link' | 'image' | 'video'
): Promise<CategorizationResult> {
  try {
    const categories = await getCategories();
    const categoryList = categories.map((c) => c.name).join(', ');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a content categorizer. Classify the following ${contentType} content into exactly one of these categories: ${categoryList}.

Content: "${content}"

Respond with ONLY a JSON object (no markdown, no code blocks):
{"category": "CategoryName", "confidence": 0.85}

Rules:
- "category" must be exactly one of: ${categoryList}
- "confidence" must be a number between 0 and 1
- If the content clearly fits a category, confidence should be >= 0.7
- If the content is ambiguous or could fit multiple categories, confidence should be < 0.7
- Default to "General" if nothing else fits`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse the JSON response, stripping any markdown code blocks
    const jsonStr = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    // Validate the category name exists
    const validCategory = categories.find(
      (c) => c.name.toLowerCase() === parsed.category.toLowerCase()
    );

    return {
      category: validCategory ? validCategory.name : 'General',
      confidence: Math.min(1, Math.max(0, parsed.confidence)),
    };
  } catch (error) {
    console.error('AI categorization failed:', error);
    return { category: 'General', confidence: 0 };
  }
}

export async function categorizeImage(
  imageBuffer: Buffer,
  caption?: string
): Promise<CategorizationResult> {
  try {
    const categories = await getCategories();
    const categoryList = categories.map((c) => c.name).join(', ');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg',
      },
    };

    const prompt = caption
      ? `Classify this image with caption "${caption}" into one of: ${categoryList}.`
      : `Look at this image and classify it into one of: ${categoryList}.`;

    const fullPrompt = `${prompt}

Respond with ONLY a JSON object (no markdown, no code blocks):
{"category": "CategoryName", "confidence": 0.85}

Rules:
- "category" must be exactly one of: ${categoryList}
- "confidence" must be between 0 and 1
- Default to "General" if unsure`;

    const result = await model.generateContent([fullPrompt, imagePart]);
    const text = result.response.text().trim();

    const jsonStr = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    const validCategory = categories.find(
      (c) => c.name.toLowerCase() === parsed.category.toLowerCase()
    );

    return {
      category: validCategory ? validCategory.name : 'General',
      confidence: Math.min(1, Math.max(0, parsed.confidence)),
    };
  } catch (error) {
    console.error('AI image categorization failed:', error);
    return { category: 'General', confidence: 0 };
  }
}
