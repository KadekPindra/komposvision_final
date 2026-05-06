import type {
  AnalyzeScanRequest,
  ChatMessageRequest,
  ChatResponse,
  ScanResponse,
} from "@/types/api";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

/**
 * Sends an image URL + user info to the backend for AI-powered
 * garbage/compost analysis. Strictly follows POST /api/scan/analyze.
 */
export async function analyzeGarbage(
  imageUrl: string,
  userId: string,
  batchId?: string | null
): Promise<ScanResponse> {
  const body: AnalyzeScanRequest = {
    image_url: imageUrl,
    user_id: userId,
    batch_id: batchId ?? null,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/scan/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data: ScanResponse = await response.json();
    return data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`analyzeGarbage failed: ${message}`);
  }
}

/**
 * Sends a chat message to the AI and returns the bot's reply.
 * Strictly follows POST /api/chat/message.
 */
export async function sendChatMessage(
  message: string,
  userId: string
): Promise<string> {
  const body: ChatMessageRequest = {
    user_id: userId,
    message,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data: ChatResponse = await response.json();
    return data.bot_message;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`sendChatMessage failed: ${message}`);
  }
}