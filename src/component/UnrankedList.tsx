import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import type { Item } from "../Types";
import CreateForm from "./CreateForm";
import SortableItem from "./SortableItem";
import { UNRANKED_DROP_ID } from "../utils/dndIds";

type UnrankedListProps = {
  items: Record<string, Item>;
  unrankedItemIds: string[];
  onAddItem: (content: string, imageUrl?: string) => void;
  onDeleteItem: (itemId: string) => void;
  showImageLabel: boolean;
  onToggleImageLabel: () => void;
};

function UnrankedList({ items, unrankedItemIds, onAddItem, onDeleteItem, showImageLabel, onToggleImageLabel }: UnrankedListProps) {
  const { setNodeRef } = useDroppable({ id: UNRANKED_DROP_ID });

  return (
    <div className="flex w-full max-w-180 flex-1 flex-col gap-3 rounded-md bg-white/60 p-3 split:min-w-88">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold md:text-2xl">未排名清單</h1>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 md:text-sm">顯示圖片名稱</span>
          <button
            type="button"
            onClick={onToggleImageLabel}
            aria-label="切換圖片名稱顯示"
            className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
              showImageLabel ? "bg-blue-500" : "bg-zinc-300"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                showImageLabel ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
      <CreateForm onAddItem={onAddItem} />
      <div ref={setNodeRef} className="flex min-h-32 min-w-0 flex-wrap content-start gap-1 rounded bg-[#c5c5c5] p-2 split:min-h-40 split:gap-2 split:p-3">
        <SortableContext items={unrankedItemIds} strategy={rectSortingStrategy}>
          {unrankedItemIds.map((itemId) => {
            const item = items[itemId];
            return <SortableItem key={item.id} item={item} onDeleteItem={onDeleteItem} showImageLabel={showImageLabel} />;
          })}
        </SortableContext>
      </div>
    </div>
  );
}

export default UnrankedList