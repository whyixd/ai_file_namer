
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "FALLBACK_KEY_IF_NEEDED_FOR_INITIALIZATION_ONLY_BUT_SHOULD_BE_SET" });
const model = "gemini-2.5-flash-preview-04-17"; 

const TEXT_MIME_TYPE_PREFIX = "text/";
const KNOWN_TEXT_MIME_TYPES = [
  "application/json", "application/xml", "application/javascript", "application/rtf",
  "application/x-python", "application/x-sh", "application/x-csh", "application/x-php",
  "application/x-java-source", "application/x-sql", "application/x-httpd-php",
  "application/csv", "text/csv", "text/markdown", "text/html", "text/css", "text/plain"
];

const getTodaysDateYYYYMMDD = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
};

export const suggestDocumentNames = async (
  originalFileName: string,
  fileContent: string, // Can be text content or base64 data string
  mimeType: string,
  namingInstruction: string // Content of naming_ref.md
): Promise<string[]> => {
  if (!API_KEY) {
    throw new Error("Gemini API key is not configured. Please set the API_KEY environment variable.");
  }

  const todaysDate = getTodaysDateYYYYMMDD();
  let requestContents: string | { parts: Part[] };
  const isTextContent = mimeType.startsWith(TEXT_MIME_TYPE_PREFIX) || KNOWN_TEXT_MIME_TYPES.includes(mimeType);

  const commonPromptInstructions = `
Your task is to generate up to 5 distinct file name suggestions.
The original filename of the uploaded file was: "${originalFileName}". Consider this original name for context, keywords, or existing naming patterns.
IMPORTANT: Each suggested name MUST strictly follow this format: [PROJECT_CODE]_AI_SUGGESTED_NAME_[YYYYMMDD].
- Replace '[PROJECT_CODE]' with the appropriate project code or identifier (e.g., the '[代號]' specified in the primary naming instructions below). You MUST refer to the primary naming instructions to determine this code. For example, if the instructions specify '[YW]' as a project code, use 'YW'.
- Replace 'AI_SUGGESTED_NAME' with a concise, descriptive name derived from the document's content AND the original filename.
    - This part should primarily be in **Traditional Chinese (繁體中文)**.
    - However, if the document content, the original filename, or the primary naming instructions (especially for project codes or key terms like 'Project Alpha', 'Status Report', 'v2', 'draft', etc.) already contain specific English words, acronyms, or proper nouns that are essential to the context, **retain those English terms as they are** within the AI_SUGGESTED_NAME. Do not translate these specific English terms to Traditional Chinese.
    - Use underscores (_) instead of spaces.
    - Ensure it is suitable for a filename.
- Replace '[YYYYMMDD]' with today's date: ${todaysDate}.

Example: If the project code derived from instructions is 'YW', the original filename was "project_phoenix_update_guide_draft.docx", the document is about a 'system update guide for Project Phoenix', and today is ${todaysDate}, a valid name could be: YW_Project_Phoenix_系統更新指南_draft_${todaysDate}. Notice how 'Project Phoenix' (an English term from original name/content) and 'draft' (from original name) are preserved while '系統更新指南' (Traditional Chinese from content) describes the content. Another example could be YW_年度財務報表_Q4_report_${todaysDate} if 'Q4 report' was a key phrase in content or original filename.

Return your suggestions strictly as a JSON array of strings. For example: ["YW_Project_Phoenix_系統更新指南_${todaysDate}", "CODE_一些重要的筆記_final_draft_${todaysDate}"]
Output ONLY the JSON array. Do not include any other text or markdown formatting around the JSON array.
`;

  if (isTextContent) {
    requestContents = `
You are an AI assistant specialized in generating relevant and creative file names, with a focus on Traditional Chinese.
The original filename provided is: "${originalFileName}".
Based on the following document content (MIME type: ${mimeType}):
--- DOCUMENT CONTENT START ---
${fileContent}
--- DOCUMENT CONTENT END ---

These are your primary naming instructions. Adhere to them closely, especially for determining project codes, general style, and context:
"${namingInstruction}"
--- END OF PRIMARY NAMING INSTRUCTIONS ---

${commonPromptInstructions}
`;
  } else {
    const fileDataPart: Part = {
      inlineData: {
        mimeType: mimeType,
        data: fileContent // This is the Base64 encoded string
      }
    };
    const textInstructionPart: Part = {
      text: `
You are an AI assistant specialized in generating relevant and creative file names, with a focus on Traditional Chinese.
You have been provided with a file (MIME type: ${mimeType}). Its original filename was "${originalFileName}". Please analyze its content and consider the original filename for context.

These are your primary naming instructions. Adhere to them closely, especially for determining project codes, general style, and context:
"${namingInstruction}"
--- END OF PRIMARY NAMING INSTRUCTIONS ---

${commonPromptInstructions}
`
    };
    requestContents = { parts: [fileDataPart, textInstructionPart] };
  }

  let genAIResponse: GenerateContentResponse | null = null;

  try {
    genAIResponse = await ai.models.generateContent({
      model: model,
      contents: requestContents,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6, 
      },
    });
    
    let jsonStr = genAIResponse.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);

    if (Array.isArray(parsedData) && parsedData.every(item => typeof item === 'string')) {
      return parsedData as string[];
    } else {
      console.error("Parsed data is not an array of strings:", parsedData);
      if (typeof parsedData === 'string') {
         throw new Error(`Received a single string from AI instead of a JSON array: "${parsedData}". Please check AI prompt for JSON array enforcement.`);
      }
      throw new Error("Received unexpected data format from AI. Expected a JSON array of strings.");
    }
  } catch (error) {
    console.error("Error calling Gemini API or parsing response:", error);
    let errorMessage = "An unknown error occurred while communicating with the AI.";
    if (error instanceof Error) {
        errorMessage = `Failed to get suggestions from AI: ${error.message}.`;
        if (error.message.includes("API key not valid")) {
             errorMessage = "Invalid Gemini API Key. Please check your configuration.";
        }
         // Check for specific finish reasons if candidates exist
        if (genAIResponse && genAIResponse.candidates && genAIResponse.candidates.length > 0) {
            const candidate = genAIResponse.candidates[0];
            if (candidate.finishReason === 'SAFETY') {
                errorMessage = "The request was blocked due to safety concerns (e.g. content policy). Please modify the content or instructions.";
            } else if (candidate.finishReason === 'RECITATION') {
                errorMessage = "The request was blocked due to recitation concerns. Please try a different prompt.";
            } else if (candidate.finishReason === 'OTHER') {
                errorMessage = "The request was stopped for other reasons by the API. Please check the console for more details if available.";
            }
        }
    }
    throw new Error(errorMessage);
  }
};
