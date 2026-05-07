import { createClient } from "@supabase/supabase-js";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase env kosong. Pastikan EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY terisi.",
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

async function pingSupabase(url: string, label: string) {
  try {
    const response = await fetch(url, { method: "GET" });
    console.log("[Upload] ping", {
      label,
      ok: response.ok,
      status: response.status,
    });
  } catch (error) {
    console.log("[Upload] ping failed", { label, error });
  }
}

/**
 * Uploads a local image to the Supabase `garbage_images` public bucket.
 * Returns the public URL of the uploaded image.
 */
export async function uploadGarbageImage(
  localUri: string,
  userId: string,
): Promise<string> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase env kosong. Pastikan EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY terisi.",
    );
  }

  const supabase = getSupabaseClient();
  console.log("[Upload] start", { localUri, userId });
  await pingSupabase(`${supabaseUrl}/auth/v1/health`, "auth");
  await pingSupabase(`${supabaseUrl}/storage/v1/version`, "storage");
  const inferFileExt = () => {
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

  if (Platform.OS !== "web" && localUri.startsWith("file://")) {
    const contentType = `image/${fileExt === "png" ? "png" : "jpeg"}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/garbage_images/${fileName}`;
    console.log("[Upload] native upload start", { uploadUrl });
    const uploadOptions: any = {
      httpMethod: "POST",
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
        "Content-Type": contentType,
      },
    };

    const uploadType = (FileSystem as any).FileSystemUploadType?.BINARY_CONTENT;
    if (uploadType) {
      uploadOptions.uploadType = uploadType;
    }

    const uploadResult = await FileSystem.uploadAsync(
      uploadUrl,
      localUri,
      uploadOptions,
    );

    console.log("[Upload] native upload completed", {
      status: uploadResult.status,
    });

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      throw new Error(
        `Supabase upload failed: ${uploadResult.status} ${uploadResult.body}`,
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("garbage_images").getPublicUrl(fileName);

    console.log("[Upload] success", { publicUrl, fileName });
    return publicUrl;
  }

  // Web upload path uses blob body
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
