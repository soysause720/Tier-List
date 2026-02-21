import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
  type Modifier,
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  type DragOverEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { TierListState, Item } from "../Types";
import TierContainer from "./TierContainer";
import UnrankedList from "./UnrankedList";
import ItemComponent from "./ItemComponent";
import {
  parseTierDropId,
  UNRANKED_CONTAINER_ID,
  UNRANKED_DROP_ID,
} from "../utils/dndIds";

// 優先用 pointerWithin（游標是否在範圍內）偵測放置目標，
// 解決 closestCenter 在空容器左半邊無法觸發的問題
const customCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) {
    return pointerHits;
  }
  return closestCenter(args);
};

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
  | { type: "ADD_ITEM"; payload: { content: string; imageUrl?: string } }
  | { type: "DELETE_ITEM"; payload: { itemId: string } }
  | { type: "MOVE_ITEM"; payload: { itemId: string; from: string; to: string } }
  | { type: "REORDER_ITEM"; payload: { itemId: string; overId: string } }
  | { type: "LOAD_STATE"; payload: TierListState };

const initialState: TierListState = {
  tiers: [
    { id: "f47ac10b-58cc-4372-a567-0e02b2c3d479", name: "夯", color: "#e83426", itemIds: ["b8c9d0e1-f2a3-4567-bcde-678901234567"] },
    { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "顶级", color: "#f3c645", itemIds: [] },
    { id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", name: "人上人", color: "#fffa00", itemIds: [] },
    { id: "c3d4e5f6-a7b8-9012-cdef-123456789012", name: "NPC", color: "#faefcf", itemIds: [] },
    { id: "d4e5f6a7-b8c9-0123-defa-234567890123", name: "拉完了", color: "#ffffff", itemIds: [] },
  ],
  items: {
    "e5f6a7b8-c9d0-1234-efab-345678901234": { id: "e5f6a7b8-c9d0-1234-efab-345678901234", content: "高松燈" },
    "f6a7b8c9-d0e1-2345-fabc-456789012345": { id: "f6a7b8c9-d0e1-2345-fabc-456789012345", content: "千早愛音" },
    "a7b8c9d0-e1f2-3456-abcd-567890123456": { id: "a7b8c9d0-e1f2-3456-abcd-567890123456", content: "長崎爽世" },
    "b8c9d0e1-f2a3-4567-bcde-678901234567": { id: "b8c9d0e1-f2a3-4567-bcde-678901234567", content: "要樂奈" },
    "c9d0e1f2-a3b4-5678-cdef-789012345678": { id: "c9d0e1f2-a3b4-5678-cdef-789012345678", content: "椎名立希" },
    "d0e1f2a3-b4c5-6789-defa-890123456789": { id: "d0e1f2a3-b4c5-6789-defa-890123456789", content: "三角初華" },
    "e1f2a3b4-c5d6-7890-efab-901234567890": { id: "e1f2a3b4-c5d6-7890-efab-901234567890", content: "豐川祥子" },
    "f2a3b4c5-d6e7-8901-fabc-012345678901": { id: "f2a3b4c5-d6e7-8901-fabc-012345678901", content: "八幡海鈴" },
    "a3b4c5d6-e7f8-9012-abcd-123456789012": { id: "a3b4c5d6-e7f8-9012-abcd-123456789012", content: "若葉睦" },
    "b4c5d6e7-f8a9-0123-bcde-234567890123": { id: "b4c5d6e7-f8a9-0123-bcde-234567890123", content: "祐天寺若麥" },
  },
  unrankedItemIds: [
    "e5f6a7b8-c9d0-1234-efab-345678901234",
    "f6a7b8c9-d0e1-2345-fabc-456789012345",
    "a7b8c9d0-e1f2-3456-abcd-567890123456",
    "c9d0e1f2-a3b4-5678-cdef-789012345678",
    "d0e1f2a3-b4c5-6789-defa-890123456789",
    "e1f2a3b4-c5d6-7890-efab-901234567890",
    "f2a3b4c5-d6e7-8901-fabc-012345678901",
    "a3b4c5d6-e7f8-9012-abcd-123456789012",
    "b4c5d6e7-f8a9-0123-bcde-234567890123",
  ],
};

function reducer(state: TierListState, action: Action): TierListState {
  switch (action.type) {
    case "ADD_ITEM": {
      // 內容與圖片至少需要其一（UI 層已擋，reducer 層作為最後防線）
      const content = action.payload.content.trim();
      const imageUrl = action.payload.imageUrl;
      if (!content && !imageUrl) return state;
      const id = crypto.randomUUID();
      const newItem: Item = { id, content, ...(imageUrl ? { imageUrl } : {}) };
      return {
        ...state,
        items: { ...state.items, [id]: newItem },
        unrankedItemIds: [...state.unrankedItemIds, id],
      };
    }
    case "DELETE_ITEM": {
      const { itemId } = action.payload;
      // item 不存在時直接回傳（防止重複刪除）
      if (!state.items[itemId]) return state;
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

      // item 不存在或來源目的地相同時不處理
      if (!state.items[itemId]) return state;
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

      // 相同 id 或任一 item 不存在時不處理
      if (itemId === overId) return state;
      if (!state.items[itemId] || !state.items[overId]) return state;

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

const STORAGE_KEY = "tier-list-state";

function isValidState(data: unknown): data is TierListState {
  if (!data || typeof data !== "object") return false;
  const s = data as Record<string, unknown>;
  return (
    Array.isArray(s.tiers) &&
    typeof s.items === "object" &&
    s.items !== null &&
    Array.isArray(s.unrankedItemIds)
  );
}

function loadFromStorage(): TierListState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidState(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function ListWrapper() {
  // lazy initializer: 先讀 localStorage，讀不到再用 initialState
  const [state, dispatch] = useReducer(reducer, undefined, () => loadFromStorage() ?? initialState);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showImageLabel, setShowImageLabel] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // state 變動時自動儲存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 空間不足時靜默失敗，不影響操作
    }
  }, [state]);

  // 限制 DragOverlay 的視覺移動範圍在 ListWrapper 內
  const restrictToWrapper = useCallback<Modifier>(({ draggingNodeRect, transform }) => {
    if (!draggingNodeRect || !wrapperRef.current) return transform;

    const rect = wrapperRef.current.getBoundingClientRect();

    return {
      ...transform,
      x: Math.min(Math.max(transform.x, rect.left - draggingNodeRect.left), rect.right - draggingNodeRect.right),
      y: Math.min(Math.max(transform.y, rect.top - draggingNodeRect.top), rect.bottom - draggingNodeRect.bottom),
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
  );

  const handleAddItem = (content: string, imageUrl?: string) => {
    dispatch({ type: "ADD_ITEM", payload: { content, imageUrl } });
  };

  const handleDeleteItem = (itemId: string) => {
    dispatch({ type: "DELETE_ITEM", payload: { itemId } });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  // 在拖曳過程中即時更新 state，讓瀏覽器 flex layout 自然處理不同大小的項目
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeItemId = String(active.id);
    const overId = String(over.id);

    if (activeItemId === overId) return;

    const fromContainer = findContainerByItemId(state, activeItemId);
    const overIsContainer = !!findContainerByDropId(state, overId);
    const toContainer = overIsContainer
      ? findContainerByDropId(state, overId)!
      : findContainerByItemId(state, overId);

    if (!fromContainer || !toContainer) return;

    if (fromContainer !== toContainer) {
      dispatch({
        type: "MOVE_ITEM",
        payload: { itemId: activeItemId, from: fromContainer, to: toContainer },
      });
    } else if (!overIsContainer) {
      dispatch({
        type: "REORDER_ITEM",
        payload: { itemId: activeItemId, overId },
      });
    }
  };

  const handleDragEnd = () => {
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeItem = activeId ? state.items[activeId] : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div ref={wrapperRef} className="mx-auto flex justify-center w-full min-w-0 max-w-400 flex-col items-center gap-1 split:gap-5 p-2 split:flex-row split:items-start">
        <TierContainer tiers={state.tiers} items={state.items} onDeleteItem={handleDeleteItem} showImageLabel={showImageLabel} onToggleImageLabel={() => setShowImageLabel((v) => !v)} />
        <UnrankedList items={state.items} unrankedItemIds={state.unrankedItemIds} onAddItem={handleAddItem} onDeleteItem={handleDeleteItem} showImageLabel={showImageLabel} />
      </div>
      <DragOverlay dropAnimation={null} modifiers={[restrictToWrapper]}>
        {activeItem ? (
          <div className="rotate-1 scale-105 cursor-grabbing drop-shadow-xl">
            <ItemComponent item={activeItem} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default ListWrapper;
