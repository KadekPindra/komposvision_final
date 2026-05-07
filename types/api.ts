export interface AnalyzeScanRequest {
  image_url: string;
  user_id: string;
  batch_id?: string | null;
}

export interface ChatMessageRequest {
  user_id: string;
  message: string;
  include_progress?: boolean;
  progress_batch_id?: string | null;
}

export interface ScanResponse {
  id: string | null;
  user_id: string;
  batch_id: string | null;
  image_url: string;
  carbon_items: string[];
  nitrogen_items: string[];
  estimated_ratio: string;
  ai_instruction: string;
}

export interface ChatResponse {
  user_message: string;
  bot_message: string;
}
