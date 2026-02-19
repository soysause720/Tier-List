import type { Tier, Item } from "../Types";
import ItemComponent from "./ItemComponent";

type TierContainerProps = {
  tiers: Tier[];
  items: Record<string, Item>;
  // 之後你可以加 moveItem 或其他事件
  // moveItem?: (itemId: string, sourceTierId: string, targetTierId: string) => void;
};

function TierContainer({ tiers, items }: TierContainerProps) {
  return (
    <div className="flex flex-col w-full md:w-200 h-103 md:h-153 p-3 box-border">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className="min-h-20 md:min-h-30 flex flex-row border-b-2 border-black"
        >
          <div
            className="w-20 md:w-36 flex items-center justify-center border-r-2 border-black text-2xl md:text-4xl font-bold font-sanse"
            style={{ backgroundColor: tier.color }}
          >
            {tier.name}
          </div>
          <div className="flex-1 flex flex-wrap items-center bg-[#c5c5c5]">
            {tier.itemIds.map((itemId) => {
              const item = items[itemId];
              return <ItemComponent item={item} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default TierContainer;
