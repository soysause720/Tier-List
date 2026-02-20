import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import type { Tier, Item } from "../Types";
import SortableItem from "./SortableItem";
import { makeTierDropId } from "../utils/dndIds";

type TierContainerProps = {
  tiers: Tier[];
  items: Record<string, Item>;
  onDeleteItem: (itemId: string) => void;
  // 之後你可以加 moveItem 或其他事件
  // moveItem?: (itemId: string, sourceTierId: string, targetTierId: string) => void;
};

type TierRowProps = {
  tier: Tier;
  items: Record<string, Item>;
  onDeleteItem: (itemId: string) => void;
};

function TierRow({ tier, items, onDeleteItem }: TierRowProps) {
  const dropId = makeTierDropId(tier.id);
  const { setNodeRef } = useDroppable({ id: dropId });

  return (
    <div
      key={tier.id}
      className="flex min-h-20 flex-row border-b-2 border-black split:min-h-30"
    >
      <div
        className="flex w-1/5 min-w-18 max-w-28 shrink-0 items-center justify-center border-r-2 border-black px-2 text-center text-lg font-bold split:max-w-32 split:text-3xl"
        style={{ backgroundColor: tier.color }}
      >
        {tier.name}
      </div>
      <div ref={setNodeRef} className="flex min-w-0 flex-1 flex-wrap content-start items-start justify-start gap-1 bg-[#c5c5c5] p-2 md:gap-2 md:p-3">
        <SortableContext items={tier.itemIds} strategy={rectSortingStrategy}>
          {tier.itemIds.map((itemId) => {
            const item = items[itemId];
            return <SortableItem key={item.id} item={item} onDeleteItem={onDeleteItem} />;
          })}
        </SortableContext>
      </div>
    </div>
  );
}

function TierContainer({ tiers, items, onDeleteItem }: TierContainerProps) {
  return (  
    <div className="flex w-full max-w-180 flex-col overflow-hidden rounded-md bg-white/60 p-2 split:p-3 split:max-w-210 split:flex-none xl:w-245">
      {tiers.map((tier) => (
        <TierRow key={tier.id} tier={tier} items={items} onDeleteItem={onDeleteItem} />
      ))}
    </div>
  );
}

export default TierContainer;
