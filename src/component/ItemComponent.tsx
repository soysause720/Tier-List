import { AiOutlineClose } from "react-icons/ai";
import type { Item } from "../Types";

type ItemComponentProps = {
  item: Item;
  onDelete?: (itemId: string) => void;
  isActive?: boolean;
  showImageLabel?: boolean;
  /** DragOverlay 脫離 @container 時，強制使用大尺寸 */
  large?: boolean;
};

// pointer: coarse = 手機/平板等觸控裝置
const isTouchDevice =
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

function ItemComponent({ item, onDelete, isActive = false, showImageLabel = true, large = false }: ItemComponentProps) {
  const deleteButton = onDelete && (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onDelete(item.id);
      }}
      className={`absolute -right-2 -top-2 h-5 w-5 z-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-xs leading-none text-zinc-700 shadow-sm transition hover:bg-red-500 hover:text-white ${
        isTouchDevice
          ? (isActive ? "flex" : "hidden")
          : (isActive ? "flex" : "hidden group-hover:flex")
      }`}
      aria-label={`刪除 ${item.content}`}
    >
      <AiOutlineClose />
    </button>
  );

  // 圖片卡片樣式（支援 imageBase64 和 imageUrl）
  const imageUrl = item.imageUrl || item.imageBase64;
  if (imageUrl) {
    return (
      <div className="group relative flex flex-col items-center w-fit rounded border border-zinc-300 bg-white shadow-sm">
        {deleteButton}
        <img
          src={imageUrl}
          alt={item.content || "圖片"}
          className={`object-cover ${large ? "h-25 w-25" : "h-17 w-17 @split:h-25 @split:w-25"} ${showImageLabel && item.content ? "rounded-t" : "rounded"}`}
          draggable={false}
        />
        {showImageLabel && item.content && (
          <span className="w-full truncate px-1 py-0.5 text-center text-xs font-medium text-zinc-900 @split:text-sm">
            {item.content}
          </span>
        )}
      </div>
    );
  }

  // 文字卡片樣式（原本設計）
  return (
    <div className={`group relative inline-flex max-w-full items-center justify-center rounded border border-zinc-300 bg-white font-medium text-zinc-900 shadow-sm ${large ? "px-4 py-2.5 text-2xl" : "px-3 py-2 text-base @split:px-4 @split:py-2.5 @split:text-2xl"}`}>
      {deleteButton}
      <span className="whitespace-nowrap">{item.content}</span>
    </div>
  );
}

export default ItemComponent;
