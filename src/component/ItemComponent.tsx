import type { Item } from "../Types";

function ItemComponent({ item }: { item: Item }) {
  return (
    <div className="flex items-center justify-center h-10 md:h-15 p-2 m-1 md:m-2 bg-white rounded shadow text-lg md:text-3xl border border-gray-300 font-serif">
      {item.content}
    </div>
  );
}

export default ItemComponent;