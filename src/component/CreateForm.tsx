import { useRef, useState } from "react";
import { AiOutlineUpload, AiOutlineCheck, AiOutlineClose } from "react-icons/ai";

type CreateFormProps = {
  onAddItem: (content: string, imageUrl?: string) => void;
};

function CreateForm({ onAddItem }: CreateFormProps) {
  const [input, setInput] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = input.trim() !== "" || imageUrl !== null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      // Center-crop 正方形再縮放到 200×200，減少 localStorage 占用
      const SIZE = 200;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d")!;

      const srcSize = Math.min(img.width, img.height);
      const srcX = (img.width - srcSize) / 2;
      const srcY = (img.height - srcSize) / 2;

      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, SIZE, SIZE);
      const compressed = canvas.toDataURL("image/jpeg", 0.85);
      setImageUrl(compressed);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAddItem(input.trim(), imageUrl ?? undefined);
    setInput("");
    setImageUrl(null);
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
        {imageUrl && (
          <div className="relative shrink-0">
            <img
              src={imageUrl}
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
          title={imageUrl ? "已上傳圖片" : "上傳圖片"}
        >
          {imageUrl ? <AiOutlineCheck className="text-green-600" /> : <AiOutlineUpload />}
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
