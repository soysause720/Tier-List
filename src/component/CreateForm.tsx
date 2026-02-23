import { useRef, useState } from "react";
import { AiOutlineUpload, AiOutlineCheck, AiOutlineClose } from "react-icons/ai";

type CreateFormProps = {
  onAddItem: (content: string, imageBase64?: string) => void;
};

function CreateForm({ onAddItem }: CreateFormProps) {
  const [input, setInput] = useState("");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = input.trim() !== "" || imageBlob !== null;

  /**
   * 將 Blob 轉換成 Base64 字串
   */
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const SIZE = 200;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d")!;

      // Center-crop 邏輯
      const srcSize = Math.min(img.width, img.height);
      const srcX = (img.width - srcSize) / 2;
      const srcY = (img.height - srcSize) / 2;

      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, SIZE, SIZE);

      // 改用 toBlob 產生 WebP 格式
      canvas.toBlob((blob) => {
        if (!blob) return;

        // ✅ 步驟 1：暫存 Blob 本地（未提交時可直接 GC）
        setImageBlob(blob);

        // ✅ 步驟 2：產生預覽用的 ObjectURL
        const objectUrlForPreview = URL.createObjectURL(blob);
        setPreviewUrl(objectUrlForPreview);
      }, "image/webp", 0.8);

      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const handleRemoveImage = () => {
    // ✅ 釋放 ObjectURL 記憶體
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    // ✅ 釋放 Blob 記憶體
    setImageBlob(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (imageBlob) {
      // ✅ Blob 轉 Base64，只有提交時才轉換
      try {
        const base64 = await blobToBase64(imageBlob);
        onAddItem(input.trim(), base64);
      } catch (error) {
        console.error("圖片轉換失敗:", error);
        return;
      }
    } else {
      onAddItem(input.trim());
    }

    // ✅ 重置表單並釋放記憶體
    setInput("");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageBlob(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex w-full min-w-0 items-center gap-2 mb-2">
        <input
          className="min-w-0 flex-1 rounded border border-zinc-400 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-600 md:text-base"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入項目名稱（可選）..."
        />
        {/* 隐藏的圖片輸入，透過按鈕觸發 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
        {/* 圖片預覽（顯示在上傳按鈕左邊） */}
        {previewUrl && (
          <div className="relative shrink-0">
            <img
              src={previewUrl}
              alt="預覽"
              className="h-10 w-10 rounded border border-zinc-300 object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 bg-white text-[10px] text-zinc-700 shadow-sm hover:bg-red-500 hover:text-white"
              aria-label="移除圖片"
            >
              <AiOutlineClose />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-zinc-400 bg-white text-lg text-zinc-700 transition hover:bg-zinc-100 active:scale-[0.98]"
          title={previewUrl ? "已上傳圖片" : "上傳圖片"}
        >
          {previewUrl ? <AiOutlineCheck className="text-green-600" /> : <AiOutlineUpload />}
        </button>
        <button
          className="h-10 shrink-0 rounded bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
          type="submit"
          disabled={!canSubmit}
        >
          新增
        </button>
      </div>
    </form>
  );
}

export default CreateForm;
