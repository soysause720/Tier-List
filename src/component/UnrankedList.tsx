import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import type { Item } from "../Types";
import CreateForm from "./CreateForm";
import SortableItem from "./SortableItem";
import { UNRANKED_DROP_ID } from "../utils/dndIds";

type UnrankedListProps = {
  items: Record<string, Item>;
  unrankedItemIds: string[];
  onAddItem: (content: string) => void;
  onDeleteItem: (itemId: string) => void;
};

function UnrankedList({ items, unrankedItemIds, onAddItem, onDeleteItem }: UnrankedListProps) {
  const { setNodeRef } = useDroppable({ id: UNRANKED_DROP_ID });

  return (
    <div className="flex w-full max-w-180 flex-1 flex-col gap-3 rounded-md bg-white/60 p-3 split:min-w-88">
      <h1 className="text-xl font-bold md:text-2xl">未排名清單</h1>
      <CreateForm onAddItem={onAddItem} />
      <div ref={setNodeRef} className="flex min-h-32 min-w-0 flex-wrap content-start gap-1 rounded bg-[#c5c5c5] p-2 split:min-h-40 split:gap-2 split:p-3">
        <SortableContext items={unrankedItemIds} strategy={rectSortingStrategy}>
          {unrankedItemIds.map((itemId) => {
            const item = items[itemId];
            return <SortableItem key={item.id} item={item} onDeleteItem={onDeleteItem} />;
          })}
        </SortableContext>
      </div>
    </div>
  );
}

export default UnrankedList