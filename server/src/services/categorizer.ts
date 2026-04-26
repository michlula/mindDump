import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { CategorizationResult, BatchMessage, BatchResult, Category } from '../types/index.js';
import { getCategories } from './supabase.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash';
const OPENROUTER_MODEL = 'google/gemma-3-12b-it:free';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function categorizeContent(
  content: string,
  contentType: 'text' | 'link' | 'image' | 'video'
): Promise<CategorizationResult> {
  try {
    const categories = await getCategories();
    const categoryList = categories.map((c) => c.name).join(', ');

    const model = genAI.getGenerativeModel({ model: PRIMARY_MODEL });

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

    const model = genAI.getGenerativeModel({ model: PRIMARY_MODEL });

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

export async function processBatch(messages: BatchMessage[], modelName?: string): Promise<BatchResult> {
  try {
    const categories = await getCategories();
    const categoryList = categories.map((c) => c.name).join(', ');

    const model = genAI.getGenerativeModel({ model: modelName || PRIMARY_MODEL });

    // Build multimodal parts
    const parts: Part[] = [];

    // Describe each message
    let messageDescriptions = '';
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      messageDescriptions += `\n[${i}] type=${msg.message_type}`;
      if (msg.content) messageDescriptions += ` content="${msg.content}"`;
      if (msg.image_buffer) messageDescriptions += ' (image attached below)';
      if (msg.media_url && msg.message_type === 'video') messageDescriptions += ' (video)';
    }

    const prompt = `You are a content organizer. You receive a batch of messages sent by a user to their personal "mind dump" app. These messages were sent in quick succession and should usually be treated as ONE thought/topic.

Your job:
1. GROUP messages together — default to ONE group unless messages are about completely different topics
2. Generate a short TITLE (2-6 words, in Hebrew) for each group
3. CATEGORIZE each group into one of: ${categoryList}
4. Assign a CONFIDENCE score (0-1) for the category

Messages:${messageDescriptions}

Respond with ONLY a JSON object (no markdown, no code blocks):
{
  "groups": [
    {
      "title": "כותרת קצרה בעברית",
      "category": "CategoryName",
      "confidence": 0.85,
      "type": "image",
      "message_indices": [0, 1]
    }
  ]
}

Rules:
- PREFER grouping all messages into a single group. Only split into multiple groups if the topics are clearly unrelated (e.g., a recipe and a job posting)
- Every message index (0 to ${messages.length - 1}) must appear in exactly one group
- "type" should be the primary content type of the group: "image" if it contains images, "video" if video, "link" if links, "text" otherwise
- "category" must be exactly one of: ${categoryList}
- "title" MUST be in Hebrew, descriptive and concise (2-6 words)
- When a group has multiple messages (e.g., image+text, link+text, video+text), check if the text message relates to the other content. If it does, prefer basing the title on the user's text. For example: image of a restaurant + text "דייט עם אלעד" → title "דייט עם אלעד". But if the text is unrelated, use your best judgment combining all content
- Default category to "General" if unsure`;

    parts.push({ text: prompt });

    // Add image parts
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.image_buffer) {
        parts.push({ text: `\n[Image for message ${i}]:` });
        parts.push({
          inlineData: {
            data: msg.image_buffer.toString('base64'),
            mimeType: 'image/jpeg',
          },
        });
      }
    }

    const result = await model.generateContent(parts);
    const text = result.response.text().trim();

    const jsonStr = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(jsonStr) as BatchResult;

    // Validate: ensure all indices covered
    const coveredIndices = new Set<number>();
    for (const group of parsed.groups) {
      for (const idx of group.message_indices) {
        coveredIndices.add(idx);
      }
      // Validate category
      const valid = categories.find(
        (c) => c.name.toLowerCase() === group.category.toLowerCase()
      );
      if (valid) {
        group.category = valid.name;
      } else {
        group.category = 'General';
      }
      group.confidence = Math.min(1, Math.max(0, group.confidence));
    }

    // Check all indices are covered
    for (let i = 0; i < messages.length; i++) {
      if (!coveredIndices.has(i)) {
        // Add uncovered message as its own group
        parsed.groups.push({
          title: messages[i].content?.slice(0, 30) || 'Untitled',
          category: 'General',
          confidence: 0,
          type: messages[i].message_type,
          message_indices: [i],
        });
      }
    }

    return parsed;
  } catch (error) {
    console.error('AI batch processing failed:', error);
    const status = (error as { status?: number }).status;
    if (status === 503 || status === 429 || status === 500) {
      throw error; // Rethrow retryable errors for retry wrapper
    }
    // Non-retryable: fallback — each message as its own group
    return {
      groups: messages.map((msg, i) => ({
        title: msg.content?.slice(0, 30) || 'Untitled',
        category: 'General',
        confidence: 0,
        type: msg.message_type,
        message_indices: [i],
      })),
    };
  }
}

export async function processBatchOpenRouter(messages: BatchMessage[]): Promise<BatchResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const categories = await getCategories();
  const categoryList = categories.map((c) => c.name).join(', ');

  let messageDescriptions = '';
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    messageDescriptions += `\n[${i}] type=${msg.message_type}`;
    if (msg.content) messageDescriptions += ` content="${msg.content}"`;
    if (msg.media_url && msg.message_type === 'video') messageDescriptions += ' (video)';
    if (msg.image_buffer) messageDescriptions += ' (image — describe based on context)';
  }

  const prompt = `You are a content organizer. You receive a batch of messages sent by a user to their personal "mind dump" app. These messages were sent in quick succession and should usually be treated as ONE thought/topic.

Your job:
1. GROUP messages together — default to ONE group unless messages are about completely different topics
2. Generate a short TITLE (2-6 words, in Hebrew) for each group
3. CATEGORIZE each group into one of: ${categoryList}
4. Assign a CONFIDENCE score (0-1) for the category

Messages:${messageDescriptions}

Respond with ONLY a JSON object (no markdown, no code blocks):
{
  "groups": [
    {
      "title": "כותרת קצרה בעברית",
      "category": "CategoryName",
      "confidence": 0.85,
      "type": "image",
      "message_indices": [0, 1]
    }
  ]
}

Rules:
- PREFER grouping all messages into a single group. Only split into multiple groups if the topics are clearly unrelated (e.g., a recipe and a job posting)
- Every message index (0 to ${messages.length - 1}) must appear in exactly one group
- "type" should be the primary content type of the group: "image" if it contains images, "video" if video, "link" if links, "text" otherwise
- "category" must be exactly one of: ${categoryList}
- "title" MUST be in Hebrew, descriptive and concise (2-6 words)
- When a group has multiple messages (e.g., image+text, link+text, video+text), check if the text message relates to the other content. If it does, prefer basing the title on the user's text. If unrelated, use your best judgment combining all content
- Default category to "General" if unsure`;

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  const text = data.choices[0].message.content.trim();

  const jsonStr = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(jsonStr) as BatchResult;

  // Validate
  const coveredIndices = new Set<number>();
  for (const group of parsed.groups) {
    for (const idx of group.message_indices) {
      coveredIndices.add(idx);
    }
    const valid = categories.find(
      (c) => c.name.toLowerCase() === group.category.toLowerCase()
    );
    if (valid) {
      group.category = valid.name;
    } else {
      group.category = 'General';
    }
    group.confidence = Math.min(1, Math.max(0, group.confidence));
  }

  for (let i = 0; i < messages.length; i++) {
    if (!coveredIndices.has(i)) {
      parsed.groups.push({
        title: messages[i].content?.slice(0, 30) || 'Untitled',
        category: 'General',
        confidence: 0,
        type: messages[i].message_type,
        message_indices: [i],
      });
    }
  }

  return parsed;
}
