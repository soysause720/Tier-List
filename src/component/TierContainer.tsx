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
    <div className="tier-container">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className="tier"
        >
          <div className="tier-name" style={{ backgroundColor: tier.color }}>{tier.name}</div>
          {tier.itemIds.map((itemId) => {
            const item = items[itemId];
            return <ItemComponent item ={item}/>;
          })}
        </div>
      ))}
    </div>
  );
}

export default TierContainer;
