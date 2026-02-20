import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useReducer, useState } from "react";
import type { TierListState, Item } from "../Types";
import TierContainer from "./TierContainer";
import UnrankedList from "./UnrankedList";
import ItemComponent from "./ItemComponent";
import {
  parseTierDropId,
  UNRANKED_CONTAINER_ID,
  UNRANKED_DROP_ID,
} from "../utils/dndIds";

function findContainerByItemId(state: TierListState, itemId: string): string | null {
  if (state.unrankedItemIds.includes(itemId)) {
    return UNRANKED_CONTAINER_ID;
  }

  const tier = state.tiers.find((currentTier) => currentTier.itemIds.includes(itemId));
  return tier ? tier.id : null;
}

function findContainerByDropId(state: TierListState, dropId: string): string | null {
  if (dropId === UNRANKED_DROP_ID) {
    return UNRANKED_CONTAINER_ID;
  }

  const tierId = parseTierDropId(dropId);
  if (!tierId) {
    return null;
  }

  const exists = state.tiers.some((tier) => tier.id === tierId);
  return exists ? tierId : null;
}

// Action 型別
type Action =
  | { type: "ADD_ITEM"; payload: { content: string } }
  | { type: "DELETE_ITEM"; payload: { itemId: string } }
  | { type: "MOVE_ITEM"; payload: { itemId: string; from: string; to: string } }
  | { type: "REORDER_ITEM"; payload: { itemId: string; overId: string } }
  | { type: "LOAD_STATE"; payload: TierListState };

const initialState: TierListState = {
  tiers: [
    { id: "1", name: "夯", color: "#e83426", itemIds: ["item4"] },
    { id: "2", name: "顶级", color: "#f3c645", itemIds: [] },
    { id: "3", name: "人上人", color: "#fffa00", itemIds: [] },
    { id: "4", name: "NPC", color: "#faefcf", itemIds: [] },
    { id: "5", name: "拉完了", color: "#ffffff", itemIds: [] },
  ],
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
  },
  unrankedItemIds: ["item1", "item2", "item3", "item5", "item6", "item7", "item8", "item9", "item10"],
};

function reducer(state: TierListState, action: Action): TierListState {
  switch (action.type) {
    case "ADD_ITEM": {
      const id = crypto.randomUUID();
      const newItem: Item = { id, content: action.payload.content };
      return {
        ...state,
        items: { ...state.items, [id]: newItem },
        unrankedItemIds: [...state.unrankedItemIds, id],
      };
    }
    case "DELETE_ITEM": {
      const { itemId } = action.payload;
      // 移除 items
      const newItems = { ...state.items };
      delete newItems[itemId];
      // 從所有 tiers 的 itemIds 移除
      const newTiers = state.tiers.map(tier => ({
        ...tier,
        itemIds: tier.itemIds.filter(id => id !== itemId),
      }));
      // 從 unrankedItemIds 移除
      const newUnranked = state.unrankedItemIds.filter(id => id !== itemId);
      return {
        ...state,
        items: newItems,
        tiers: newTiers,
        unrankedItemIds: newUnranked,
      };
    }
    case "MOVE_ITEM": {
      const { itemId, from, to } = action.payload;

      if (from === to) {
        return state;
      }

      const tiers = state.tiers.map((tier) => ({ ...tier, itemIds: [...tier.itemIds] }));
      let unrankedItemIds = [...state.unrankedItemIds];

      if (from === UNRANKED_CONTAINER_ID) {
        unrankedItemIds = unrankedItemIds.filter((id) => id !== itemId);
      } else {
        const sourceTierIndex = tiers.findIndex((tier) => tier.id === from);
        if (sourceTierIndex !== -1) {
          tiers[sourceTierIndex].itemIds = tiers[sourceTierIndex].itemIds.filter((id) => id !== itemId);
        }
      }

      if (to === UNRANKED_CONTAINER_ID) {
        if (!unrankedItemIds.includes(itemId)) {
          unrankedItemIds.push(itemId);
        }
      } else {
        const targetTierIndex = tiers.findIndex((tier) => tier.id === to);
        if (targetTierIndex !== -1 && !tiers[targetTierIndex].itemIds.includes(itemId)) {
          tiers[targetTierIndex].itemIds.push(itemId);
        }
      }

      return {
        ...state,
        tiers,
        unrankedItemIds,
      };
    }
    case "REORDER_ITEM": {
      const { itemId, overId } = action.payload;

      if (itemId === overId) {
        return state;
      }

      const unrankedFromIndex = state.unrankedItemIds.indexOf(itemId);
      const unrankedToIndex = state.unrankedItemIds.indexOf(overId);
      if (unrankedFromIndex !== -1 && unrankedToIndex !== -1) {
        const reordered = [...state.unrankedItemIds];
        const [movedItem] = reordered.splice(unrankedFromIndex, 1);
        reordered.splice(unrankedToIndex, 0, movedItem);
        return {
          ...state,
          unrankedItemIds: reordered,
        };
      }

      const tiers = state.tiers.map((tier) => {
        const fromIndex = tier.itemIds.indexOf(itemId);
        const toIndex = tier.itemIds.indexOf(overId);

        if (fromIndex === -1 || toIndex === -1) {
          return tier;
        }

        const reordered = [...tier.itemIds];
        const [movedItem] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, movedItem);

        return {
          ...tier,
          itemIds: reordered,
        };
      });

      return {
        ...state,
        tiers,
      };
    }
    case "LOAD_STATE": {
      return action.payload;
    }
    default:
      return state;
  }
}

function ListWrapper() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );

  const handleAddItem = (content: string) => {
    dispatch({ type: "ADD_ITEM", payload: { content } });
  };

  const handleDeleteItem = (itemId: string) => {
    dispatch({ type: "DELETE_ITEM", payload: { itemId } });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeItemId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (!overId || activeItemId === overId) {
      setActiveId(null);
      return;
    }

    const fromContainerId = findContainerByItemId(state, activeItemId);
    const toContainerId = findContainerByItemId(state, overId) ?? findContainerByDropId(state, overId);

    if (!fromContainerId || !toContainerId) {
      setActiveId(null);
      return;
    }

    if (fromContainerId === toContainerId) {
      if (findContainerByDropId(state, overId)) {
        setActiveId(null);
        return;
      }

      dispatch({
        type: "REORDER_ITEM",
        payload: { itemId: activeItemId, overId },
      });
    } else {
      dispatch({
        type: "MOVE_ITEM",
        payload: { itemId: activeItemId, from: fromContainerId, to: toContainerId },
      });
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeItem = activeId ? state.items[activeId] : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="mx-auto flex justify-center w-full min-w-0 max-w-400 flex-col items-center gap-4 p-3 md:gap-5 md:p-4 split:flex-row split:items-start split:gap-6 split:p-5">
        <TierContainer tiers={state.tiers} items={state.items} onDeleteItem={handleDeleteItem} />
        <UnrankedList items={state.items} unrankedItemIds={state.unrankedItemIds} onAddItem={handleAddItem} onDeleteItem={handleDeleteItem} />
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="pointer-events-none">
            <ItemComponent item={activeItem} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default ListWrapper;
