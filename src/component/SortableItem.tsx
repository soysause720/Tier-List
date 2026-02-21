import { useSortable } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import type { Item } from "../Types";
import ItemComponent from "./ItemComponent";

type SortableItemProps = {
  item: Item;
  onDeleteItem: (itemId: string) => void;
  showImageLabel: boolean;
};

// pointer: coarse = 手機/平板等觸控裝置
const isTouchDevice =
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

function SortableItem({ item, onDeleteItem, showImageLabel }: SortableItemProps) {
  const [isActive, setIsActive] = useState(false);

  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: item.id,
    animateLayoutChanges: () => false,
  });

  // 開始拖曳時關閉 X 按鈕
  useEffect(() => {
    if (isDragging) setIsActive(false);
  }, [isDragging]);

  const handleClick = () => {
    if (isTouchDevice) {
      setIsActive((v) => !v);
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`relative self-start touch-none select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
    >
      {/* 拖曳中顯示虛線佔位框，讓使用者知道空位在哪 */}
      {isDragging && (
        <div className="absolute inset-0 rounded border-2 border-dashed border-zinc-400/60 bg-zinc-200/40" />
      )}
      <div className={isDragging ? "opacity-0" : ""}>
        <ItemComponent item={item} onDelete={onDeleteItem} isActive={isActive} showImageLabel={showImageLabel} />
      </div>
    </div>
  );
}

export default SortableItem;
