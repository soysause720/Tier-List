import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { AiOutlineDownload, AiOutlineShareAlt } from "react-icons/ai";
import type { Tier, Item } from "../Types";
import SortableItem from "./SortableItem";
import { makeTierDropId } from "../utils/dndIds";

type TierContainerProps = {
  tiers: Tier[];
  items: Record<string, Item>;
  onDeleteItem: (itemId: string) => void;
  showImageLabel: boolean;
  onToggleImageLabel: () => void;
};

type TierRowProps = {
  tier: Tier;
  items: Record<string, Item>;
  onDeleteItem: (itemId: string) => void;
  showImageLabel: boolean;
};

function TierRow({ tier, items, onDeleteItem, showImageLabel }: TierRowProps) {
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
      <div ref={setNodeRef} className="flex min-w-0 flex-1 flex-wrap content-start items-start justify-start bg-[#c5c5c5] gap-1 p-1 split:p-2">
        <SortableContext items={tier.itemIds} strategy={rectSortingStrategy}>
          {tier.itemIds.map((itemId) => {
            const item = items[itemId];
            return <SortableItem key={item.id} item={item} onDeleteItem={onDeleteItem} showImageLabel={showImageLabel} />;
          })}
        </SortableContext>
      </div>
    </div>
  );
}

function TierContainer({ tiers, items, onDeleteItem, showImageLabel, onToggleImageLabel }: TierContainerProps) {
  return (  
    <div className="flex w-full max-w-180 flex-col overflow-hidden rounded-md bg-white/60 p-2 split:p-3 split:max-w-210 split:flex-none xl:w-245">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="下載圖片"
            className="flex h-10 items-center gap-1 rounded border border-zinc-400 bg-white px-2.5 text-sm text-zinc-700 transition hover:bg-zinc-100 active:scale-[0.98]"
          >
            <AiOutlineDownload className="text-base" />
            <span>下載</span>
          </button>
          <button
            type="button"
            title="分享"
            className="flex h-10 items-center gap- rounded border border-zinc-400 bg-white px-2.5 text-sm text-zinc-700 transition hover:bg-zinc-100 active:scale-[0.98]"
          >
            <AiOutlineShareAlt className="text-base" />
            <span>分享</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 md:text-sm">顯示圖片名稱</span>
          <button
            type="button"
            onClick={onToggleImageLabel}
            aria-label="切換圖片名稱顯示"
            className={`relative ml-1.5 h-5 w-9 rounded-full transition-colors duration-200 ${
              showImageLabel ? "bg-blue-500" : "bg-zinc-300"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                showImageLabel ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
      {tiers.map((tier) => (
        <TierRow key={tier.id} tier={tier} items={items} onDeleteItem={onDeleteItem} showImageLabel={showImageLabel} />
      ))}
    </div>
  );
}

export default TierContainer;
