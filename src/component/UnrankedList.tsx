import type { Item } from "../Types";
import ItemComponent from "./ItemComponent";

function UnrankedList({items, unrankedItemIds}: {items: Record<string, Item>, unrankedItemIds: string[]}) {
  return (
    <div className="unranked-list">
      <h1>UnrankedList</h1>
      {unrankedItemIds.map((itemId) => {
        const item = items[itemId];
        return <ItemComponent key={item.id} item={item} />;
      })}
    </div>
  )
}

export default UnrankedList