import type { Item } from "../Types";
import ItemComponent from "./ItemComponent";

function UnrankedList({items, unrankedItemIds}: {items: Record<string, Item>, unrankedItemIds: string[]}) {
  return (
    <div className="flex flex-1 flex-col m-4 gap-3">
      <h1 className="text-xl font-bold">未排名清單</h1>
      <div className="flex flex-wrap p-2 bg-[#c5c5c5] rounded">
      {unrankedItemIds.map((itemId) => {
        const item = items[itemId];
        return <ItemComponent key={item.id} item={item} />;
      })}
      </div>
    </div>
  )
}

export default UnrankedList