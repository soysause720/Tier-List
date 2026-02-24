import { supabase } from "./supabaseClient";
import type { TierListState, Item } from "../Types";

/**
 * 將 Base64 Data URL 轉換成 File 物件
 */
function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/webp";
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new File([u8arr], filename, { type: mime });
}

/**
 * 上傳所有圖片到 Supabase Storage
 * @param tierListId - Tier List 的 UUID（用於建立資料夾）
 * @param items - 所有 Items 物件
 * @returns { itemId: publicUrl } 的 Map
 */
async function uploadImages(
  tierListId: string,
  items: Record<string, Item>
): Promise<Record<string, string>> {
  const imageUrls: Record<string, string> = {};

  for (const [itemId, item] of Object.entries(items)) {
    if (!item.imageBase64) continue;

    try {
      const file = base64ToFile(item.imageBase64, `${itemId}.webp`);
      const filePath = `tierlist-${tierListId}/${itemId}.webp`;

      // 使用 upsert: true，如果檔案已存在則覆蓋
      const { error } = await supabase.storage
        .from("upload-images")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      // 取得 Public URL
      const { data } = supabase.storage
        .from("upload-images")
        .getPublicUrl(filePath);

      imageUrls[itemId] = data.publicUrl;
    } catch (error) {
      console.error(`上傳圖片失敗 (${itemId}):`, error);
      throw error; // 任何一個失敗就中止
    }
  }

  return imageUrls;
}

/**
 * 建立分享記錄
 * @param state - 原始的 TierListState
 * @param imageUrls - { itemId: publicUrl } 的 Map
 * @returns 記錄 ID (UUID)
 */
async function createShareRecord(
  state: TierListState,
  imageUrls: Record<string, string>
): Promise<string> {
  // 建立新的 State，用 Public URLs 替換 imageBase64
  const newState: TierListState = {
    ...state,
    items: Object.fromEntries(
      Object.entries(state.items).map(([itemId, item]) => {
        const newItem = { ...item };
        if (imageUrls[itemId]) {
          // 用公開 URL 替換 Base64
          delete newItem.imageBase64;
          newItem.imageUrl = imageUrls[itemId];
        }
        return [itemId, newItem];
      })
    ),
  };

  // 建立新記錄
  const { data, error } = await supabase
    .from("tier-lists")
    .insert([
      {
        data: newState,
        created_at: new Date().toISOString(),
      },
    ])
    .select("id");

  if (error) {
    console.error("寫入資料庫失敗:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("無法取得分享 ID");
  }

  return data[0].id;
}

/**
 * 完整的分享流程
 * @param state - 完整的 TierListState
 * @returns 分享連結
 */
export async function shareToSupabase(state: TierListState): Promise<string> {
  try {
    // 生成 UUID 用於存儲資料夾
    const tierListId = crypto.randomUUID();

    // 1. 上傳所有圖片
    const imageUrls = await uploadImages(tierListId, state.items);

    // 2. 建立分享記錄
    const shareId = await createShareRecord(state, imageUrls);

    // 3. 返回分享連結
    const shareUrl = `${window.location.origin}/share/${shareId}`;
    return shareUrl;
  } catch (error) {
    console.error("分享失敗:", error);
    throw error;
  }
}
