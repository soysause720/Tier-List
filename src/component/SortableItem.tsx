import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Item } from "../Types";
import ItemComponent from "./ItemComponent";

type SortableItemProps = {
  item: Item;
  onDeleteItem: (itemId: string) => void;
};

function SortableItem({ item, onDeleteItem }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? "cursor-grabbing opacity-60 touch-none" : "cursor-grab touch-none"}
    >
      <ItemComponent item={item} onDelete={onDeleteItem} />
    </div>
  );
}

export default SortableItem;
