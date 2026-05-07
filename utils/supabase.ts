import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a local image to the Supabase `garbage_images` public bucket.
 * Returns the public URL of the uploaded image.
 */
export async function uploadGarbageImage(
  localUri: string,
  userId: string
): Promise<string> {
  // Fetch the local file as a blob
  const response = await fetch(localUri);
  const blob = await response.blob();

  const fileExt = localUri.split(".").pop() ?? "jpg";
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("garbage_images")
    .upload(fileName, blob, {
      contentType: `image/${fileExt === "png" ? "png" : "jpeg"}`,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("garbage_images").getPublicUrl(fileName);

  return publicUrl;
}
