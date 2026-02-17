import type { Item } from "../Types";

function ItemComponent({ item }: { item: Item }) {
  return (
    <div className="item">
      {item.content}
    </div>
  );
}

export default ItemComponent;