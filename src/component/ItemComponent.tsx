import { AiOutlineClose } from "react-icons/ai";
import type { Item } from "../Types";

type ItemComponentProps = {
  item: Item;
  onDelete?: (itemId: string) => void;
  isActive?: boolean;
  showImageLabel?: boolean;
};

function ItemComponent({ item, onDelete, isActive = false, showImageLabel = true }: ItemComponentProps) {
  const deleteButton = onDelete && (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onDelete(item.id);
      }}
      className={`absolute -right-2 -top-2 h-5 w-5 items-center justify-center rounded-full border border-zinc-300 bg-white text-xs leading-none text-zinc-700 shadow-sm transition hover:bg-red-500 hover:text-white ${
        isActive ? "flex" : "hidden group-hover:flex"
      }`}
      aria-label={`刪除 ${item.content}`}
    >
      <AiOutlineClose />
    </button>
  );

  // 圖片卡片樣式
  if (item.imageUrl) {
    return (
      <div className="group relative flex flex-col items-center rounded border border-zinc-300 bg-white shadow-sm">
        {deleteButton}
        <img
          src={item.imageUrl}
          alt={item.content || "圖片"}
          className={`h-17 w-17 object-cover @split:h-25 @split:w-25 ${showImageLabel && item.content ? "rounded-t" : "rounded"}`}
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
    <div className="group relative inline-flex max-w-full items-center justify-center rounded border border-zinc-300 bg-white px-3 py-2 text-base font-medium text-zinc-900 shadow-sm @split:px-4 @split:py-2.5 @split:text-2xl">
      {deleteButton}
      <span className="whitespace-nowrap">{item.content}</span>
    </div>
  );
}

export default ItemComponent;
