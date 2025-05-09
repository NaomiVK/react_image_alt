// src/services/openRouterService.ts
import { OpenRouterResponse } from '../types'; // Your custom type for API responses

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Helper function to ensure model names are properly formatted
function getFormattedModelName(modelName: string): string {
  // Make sure model names are correctly formatted
  // This helps prevent 404 errors due to incorrect model names
  
  // Map of known model names and their correct format
  const modelMap: {[key: string]: string} = {
    'qwen/qwen2.5-vl-32b-instruct:free': 'qwen/qwen2.5-vl-32b-instruct:free',
    'openai/gpt-4o-mini': 'openai/gpt-4o-mini'
  };
  
  // If the model is in our map, return the correctly formatted version
  if (modelMap[modelName]) {
    return modelMap[modelName];
  }
  
  // Otherwise return the original name
  return modelName;
}

// Internal function to get raw vision analysis from OpenRouter
async function fetchVisionAnalysisFromAPI(
  apiKey: string,
  model: string,
  base64ImageDataWithPrefix: string, // e.g., "data:image/jpeg;base64,..."
  fileNameForContext: string,
  isPdfPage: boolean
): Promise<{ text: string; error?: string }> {
  let prompt: string;
  let max_tokens: number;

  // Determine prompt and max_tokens based on content type (PDF page vs. regular image) and model
  if (isPdfPage) {
    if (model.includes('openai')) {
      prompt = "Extract and describe all content from this PDF page for accessibility purposes. Include all text content (headings, paragraphs, lists, tables, form fields), preserve formatting structure, and briefly describe any visual elements. Be comprehensive but clear.";
    } else {
      prompt = "Provide a thorough description of the text content in this page. Be concise and don't truncate your response.";
    }
    max_tokens = 800; // Allow more tokens for detailed PDF descriptions
  } else {
    if (model.includes('openai')) {
      prompt = "Generate a concise alt text for this image (15-20 words). Describe the main subject directly without phrases like 'The image shows'. Focus on key elements for accessibility using simple language.";
    } else {
      prompt = "Create a short, concise alt text for this image suitable for a website. DO NOT start with phrases like 'The image depicts', 'The image shows', or similar. Instead, directly describe the main subject in 15-20 words maximum. Focus only on the key elements necessary for accessibility. Use simple, direct language without unnecessary words.";
    }
    max_tokens = 70; // Max tokens for concise alt text
  }

  // Construct messages payload, format differs for some models
  let messages;
  
  // For OpenAI models
  if (model.includes('openai')) {
    messages = [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: base64ImageDataWithPrefix } }
      ]
    }];
  }
  // For Llama and Qwen models
  else if (model.includes('llama') || model.includes('qwen')) {
    messages = [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: base64ImageDataWithPrefix } }
      ]
    }];
  }
  // Standard format for Gemini, etc.
  else {
    messages = [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: base64ImageDataWithPrefix } },
        { type: 'text', text: prompt }
      ]
    }];
  }

  // Ensure model name is properly formatted
  const formattedModel = getFormattedModelName(model);
  
  const payload = {
    model: formattedModel,
    messages: messages,
    max_tokens: max_tokens,
    temperature: 0.3, // Low temperature for more deterministic output
    top_p: 0.85,
  };

  try {
    console.log(`Requesting vision analysis for "${fileNameForContext}" using model ${formattedModel}`);
    console.log(`Request payload:`, JSON.stringify({
      model: formattedModel,
      messages: messages.map(m => ({
        role: m.role,
        content: Array.isArray(m.content) ?
          m.content.map(c => c.type === 'text' ? { type: 'text', text: c.text } : { type: 'image_url' }) :
          m.content
      })),
      max_tokens: max_tokens,
      temperature: 0.3,
    }, null, 2));
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // Optional, but good practice for OpenRouter
        // 'HTTP-Referer': window.location.origin, 
        // 'X-Title': 'Image Alt Text Assistant (NaomiVK)',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
      console.error(`OpenRouter Vision API Error (${response.status}) for "${fileNameForContext}" with model "${formattedModel}":`, errorData.error?.message || response.statusText);
      
      // Provide more specific error messages for common issues
      if (response.status === 404) {
        return {
          text: '',
          error: `Model not found (404): The model "${formattedModel}" was not found on OpenRouter. Please check if the model ID is correct and available.`
        };
      } else if (response.status === 401 || response.status === 403) {
        return {
          text: '',
          error: `Authentication error (${response.status}): Please check your OpenRouter API key.`
        };
      } else {
        return {
          text: '',
          error: `API request failed (${response.status}): ${errorData.error?.message || response.statusText}. Model: ${formattedModel}`
        };
      }
    }
    const data = await response.json() as OpenRouterResponse;
    
    // Log the full API response for debugging
    console.log(`OpenRouter API response for "${fileNameForContext}":`, JSON.stringify(data, null, 2));
    
    // More robust error checking with detailed error messages
    if (!data) {
      console.error(`Empty API response for "${fileNameForContext}"`);
      return { text: '', error: 'API returned an empty response. Please check your API key and try again.' };
    }
    
    if (data.error) {
      console.error(`API error for "${fileNameForContext}":`, data.error);
      return {
        text: '',
        error: `API error: ${data.error.message || data.error.type || 'Unknown error'} (${data.error.code || 'no code'})`
      };
    }
    
    if (!data.choices) {
      console.error(`Missing 'choices' in API response for "${fileNameForContext}":`, data);
      return { text: '', error: 'API response missing "choices" field. Please check your API key and model selection.' };
    }
    
    if (!Array.isArray(data.choices)) {
      console.error(`'choices' is not an array in API response for "${fileNameForContext}":`, data);
      return { text: '', error: 'API response "choices" is not an array. Unexpected response format.' };
    }
    
    if (data.choices.length === 0) {
      console.error(`Empty 'choices' array in API response for "${fileNameForContext}":`, data);
      return { text: '', error: 'API returned empty "choices" array. The model may have failed to generate a response.' };
    }
    
    const content = data.choices[0]?.message?.content?.trim();
    if (!content) return { text: '', error: 'No content received from vision model.' };
    return { text: content };
  } catch (error: any) {
    console.error(`Network or other error during vision analysis for "${fileNameForContext}":`, error);
    return { text: '', error: error.message || 'Network error or unexpected issue during vision analysis.' };
  }
}

// Internal function to translate text to French using OpenRouter
async function fetchTranslationFromAPI(
  apiKey: string,
  textToTranslate: string,
  contextFileName: string
): Promise<{ text: string; error?: string }> {
  if (!textToTranslate.trim()) return { text: '' }; // Don't translate empty strings

  const translationModel = "mistralai/mixtral-8x7b-instruct"; // A good model for translation
  const messages = [
    {
      role: 'system',
      content: "You are a professional translator. Your task is to translate the following text from English to French. CRITICAL INSTRUCTION: You must provide ONLY the direct translation. DO NOT include any explanations, notes, disclaimers, or additional commentary of any kind. DO NOT include phrases like 'Here is the translation:'. DO NOT wrap your response in quotes. Simply translate the text directly, maintaining the same tone and style of the original."
    },
    { role: 'user', content: textToTranslate }
  ];
  const payload = {
    model: translationModel,
    messages: messages,
    temperature: 0.1, // Very low temperature for direct translation
    max_tokens: Math.max(300, Math.ceil(textToTranslate.length * 3)), // Generous token limit
    top_p: 0.9,
  };

  try {
    console.log(`Requesting translation for "${contextFileName}" using model ${translationModel}`);
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
      console.error(`OpenRouter Translation API Error (${response.status}) for "${contextFileName}":`, errorData.error?.message || response.statusText);
      return { text: '', error: `API request failed (${response.status}): ${errorData.error?.message || response.statusText}` };
    }
    const data = await response.json() as OpenRouterResponse;
    
    // Log the full API response for debugging
    console.log(`OpenRouter Translation API response for "${contextFileName}":`, JSON.stringify(data, null, 2));
    
    // More robust error checking with detailed error messages
    if (!data) {
      console.error(`Empty API response for translation of "${contextFileName}"`);
      return { text: '', error: 'API returned an empty response. Please check your API key and try again.' };
    }
    
    if (data.error) {
      console.error(`API error for translation of "${contextFileName}":`, data.error);
      return {
        text: '',
        error: `API error: ${data.error.message || data.error.type || 'Unknown error'} (${data.error.code || 'no code'})`
      };
    }
    
    if (!data.choices) {
      console.error(`Missing 'choices' in API response for translation of "${contextFileName}":`, data);
      return { text: '', error: 'API response missing "choices" field. Please check your API key and model selection.' };
    }
    
    if (!Array.isArray(data.choices)) {
      console.error(`'choices' is not an array in API response for translation of "${contextFileName}":`, data);
      return { text: '', error: 'API response "choices" is not an array. Unexpected response format.' };
    }
    
    if (data.choices.length === 0) {
      console.error(`Empty 'choices' array in API response for translation of "${contextFileName}":`, data);
      return { text: '', error: 'API returned empty "choices" array. The model may have failed to generate a response.' };
    }
    
    let translation = data.choices[0]?.message?.content?.trim();
    if (!translation) return { text: '', error: 'No content received from translation model.' };
    
    // Clean up common unwanted prefixes (though the system prompt tries to prevent them)
    translation = translation.replace(/^(Voici la traduction|Translation)\s*[:：]?\s*/i, '');
    translation = translation.replace(/^["“](.*)["”]$/, '$1'); // Remove surrounding quotes

    return { text: translation };
  } catch (error: any) {
    console.error(`Network or other error during translation for "${contextFileName}":`, error);
    return { text: '', error: error.message || 'Network error or unexpected issue during translation.' };
  }
}

// Exported main function to get both alt text/description and its translation
export async function getAltTextAndTranslation(
  apiKey: string,
  visionModel: string,
  base64ImageDataWithPrefix: string,
  fileNameForContext: string, // For logging and context
  isPdfPage: boolean
): Promise<{ altTextEn: string; altTextFr: string; error?: string }> {
  const visionResult = await fetchVisionAnalysisFromAPI(apiKey, visionModel, base64ImageDataWithPrefix, fileNameForContext, isPdfPage);
  
  let englishText = visionResult.text;
  let overallError = visionResult.error;

  if (!englishText && !overallError) { // If no text and no error, set a generic error
    overallError = 'Vision analysis did not produce any text output.';
  }
  if (!englishText && overallError) { // If error and no text, return immediately
     return { altTextEn: '', altTextFr: '', error: overallError };
  }
  // If there's text, proceed to translation even if there was a minor vision warning
  
  const translationResult = await fetchTranslationFromAPI(apiKey, englishText, fileNameForContext);
  const frenchText = translationResult.text;

  // Consolidate errors
  if (translationResult.error) {
    if (overallError) {
      overallError += ` | Translation Error: ${translationResult.error}`;
    } else {
      overallError = `Translation Error: ${translationResult.error}`;
    }
  }

  return { altTextEn: englishText, altTextFr: frenchText, error: overallError };
}