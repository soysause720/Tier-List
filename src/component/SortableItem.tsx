import { useSortable } from "@dnd-kit/sortable";
import type { Item } from "../Types";
import ItemComponent from "./ItemComponent";

type SortableItemProps = {
  item: Item;
  onDeleteItem: (itemId: string) => void;
};

function SortableItem({ item, onDeleteItem }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: item.id,
    animateLayoutChanges: () => false,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={
        isDragging
          ? "self-start cursor-grabbing opacity-0 touch-none"
          : "self-start cursor-grab touch-none"
      }
    >
      <ItemComponent item={item} onDelete={onDeleteItem} />
    </div>
  );
}

export default SortableItem;
