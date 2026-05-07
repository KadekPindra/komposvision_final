import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a local image to the Supabase `garbage_images` public bucket.
 * Returns the public URL of the uploaded image.
 */
export async function uploadGarbageImage(
  localUri: string,
  userId: string,
): Promise<string> {
  console.log("[Upload] start", { localUri, userId });
  // Fetch the local file as a blob
  let response: Response;
  try {
    response = await fetch(localUri);
  } catch (error) {
    console.log("[Upload] fetch localUri failed", { error });
    throw error;
  }

  console.log("[Upload] fetch localUri response", {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
  });

  const blob = await response.blob();
  console.log("[Upload] blob ready", { size: blob.size, type: blob.type });

  const inferFileExt = () => {
    if (blob.type) {
      const typeExt = blob.type.split("/").pop();
      if (typeExt) return typeExt;
    }

    if (localUri.startsWith("data:")) {
      const match = localUri.match(/^data:([^;]+);/i);
      if (match?.[1]) {
        const dataExt = match[1].split("/").pop();
        if (dataExt) return dataExt;
      }
    }

    const pathMatch = localUri.match(/\.([a-z0-9]+)(\?.*)?$/i);
    if (pathMatch?.[1]) return pathMatch[1];

    return "jpg";
  };

  const fileExt = inferFileExt();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  let uploadResult: { error: any } | null = null;
  const uploadStart = Date.now();
  const uploadTimeoutId = setTimeout(() => {
    console.log("[Upload] still waiting", {
      ms: Date.now() - uploadStart,
    });
  }, 10000);
  try {
    console.log("[Upload] supabase upload start", { fileName });
    uploadResult = await supabase.storage
      .from("garbage_images")
      .upload(fileName, blob, {
        contentType: blob.type || `image/${fileExt === "png" ? "png" : "jpeg"}`,
        upsert: false,
      });
  } catch (error) {
    clearTimeout(uploadTimeoutId);
    console.log("[Upload] supabase upload threw", { error });
    throw error;
  }

  clearTimeout(uploadTimeoutId);
  console.log("[Upload] supabase upload completed", {
    ms: Date.now() - uploadStart,
    hasError: !!uploadResult?.error,
  });

  const { error } = uploadResult;

  if (error) {
    console.log("[Upload] supabase upload error", {
      message: error.message,
      name: error.name,
      status: error.status,
    });
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("garbage_images").getPublicUrl(fileName);

  console.log("[Upload] success", { publicUrl, fileName });

  return publicUrl;
}
