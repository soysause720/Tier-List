import { useState } from "react";
import type { TierListState, Tier, Item } from "../Types";
import TierContainer from "./TierContainer";
import UnrankedList from "./UnrankedList";

function ListWrapper() {
  const [state, setState] = useState<TierListState>({
    tiers: [
      { id: "1", name: "夯", color: "#e83426", itemIds: ["item4"] },
      { id: "2", name: "顶级", color: "#f3c645", itemIds: [] },
      { id: "3", name: "人上人", color: "#fffa00", itemIds: [] },
      { id: "4", name: "NPC", color: "#faefcf", itemIds: [] },
      { id: "5", name: "拉完了", color: "#ffffff", itemIds: [] },
    ], // 初始化 tiers
    items: {
      item1: { id: "item1", content: "高松燈"},
      item2: { id: "item2", content: "千早愛音" },
      item3: { id: "item3", content: "長崎爽世" },
      item4: { id: "item4", content: "要樂奈" },
      item5: { id: "item5", content: "椎名立希" },
      item6: { id: "item6", content: "三角初華" },
      item7: { id: "item7", content: "豐川祥子" },
      item8: { id: "item8", content: "八幡海鈴" },
      item9: { id: "item9", content: "若葉睦" },
      item10: { id: "item10", content: "祐天寺若麥" },
    }, // 初始化 items
    unrankedItemIds: ["item1", "item2", "item3", "item5", "item6", "item7", "item8", "item9", "item10"], // 初始化 unrankedItemIds 為空陣列
  });
  return (
    <div className="list-wrapper">
      <TierContainer tiers={state.tiers} items={state.items} />
      <UnrankedList items={state.items} unrankedItemIds={state.unrankedItemIds} />
    </div>
  );
}

export default ListWrapper;
