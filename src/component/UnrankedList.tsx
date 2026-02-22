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
};

function UnrankedList({ items, unrankedItemIds, onAddItem, onDeleteItem, showImageLabel }: UnrankedListProps) {
  const { setNodeRef } = useDroppable({ id: UNRANKED_DROP_ID });

  return (
    <div className="flex w-full max-w-180 @split:max-w-120 flex-1 flex-col bg-white/60 p-3 @split:min-w-88">
      <CreateForm onAddItem={onAddItem} />
      <div ref={setNodeRef} className="flex min-h-32 min-w-0 flex-wrap content-start gap-1 rounded  bg-[#e6e3e3] p-2 @split:min-h-155 @split:gap-2 @split:p-3">
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