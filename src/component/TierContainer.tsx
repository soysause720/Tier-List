import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { AiOutlineDownload, AiOutlineShareAlt } from "react-icons/ai";
import type { RefObject } from "react";
import { useState } from "react";
import { domToPng } from "modern-screenshot";
import type { Tier, Item, TierListState } from "../Types";
import SortableItem from "./SortableItem";
import { makeTierDropId } from "../utils/dndIds";
import { shareToSupabase } from "../utils/shareUtils";
import Toast from "./Toast";

type TierContainerProps = {
  state: TierListState;
  tiers: Tier[];
  items: Record<string, Item>;
  onDeleteItem: (itemId: string) => void;
  showImageLabel: boolean;
  onToggleImageLabel: () => void;
  screenshotRef?: RefObject<HTMLDivElement | null>;
};

type TierRowProps = {
  tier: Tier;
  items: Record<string, Item>;
  onDeleteItem: (itemId: string) => void;
  showImageLabel: boolean;
  isLast?: boolean;
};

function TierRow({ tier, items, onDeleteItem, showImageLabel, isLast = false }: TierRowProps) {
  const dropId = makeTierDropId(tier.id);
  const { setNodeRef } = useDroppable({ id: dropId });

  return (
    <div
      className="flex min-h-20 flex-row @split:min-h-30 last:[&>div:nth-child(2)]:shadow-none"
    >
      <div
        className={`flex w-1/5 min-w-18 max-w-28 shrink-0 items-center justify-center px-2 text-center text-lg font-bold @split:max-w-32 @split:text-3xl shadow-[inset_0_-1px_0_0_#000,inset_-1px_0_0_0_#000] @split:shadow-[inset_0_-2px_0_0_#000,inset_-2px_0_0_0_#000] ${isLast ? "shadow-[inset_-1px_0_0_0_#000] @split:shadow-[inset_-2px_0_0_0_#000]" : ""}`}
        style={{ backgroundColor: tier.color }}
      >
        {tier.name}
      </div>
      <div ref={setNodeRef} className={`flex min-w-0 flex-1 flex-wrap content-start items-start justify-start bg-[#c5c5c5] gap-1 p-1 @split:p-2 shadow-[inset_0_-1px_0_0_#000] @split:shadow-[inset_0_-2px_0_0_#000] ${isLast ? "shadow-none" : ""}`}>
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

function TierContainer({ state, tiers, items, onDeleteItem, showImageLabel, onToggleImageLabel, screenshotRef }: TierContainerProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleDownload = async () => {
    if (!screenshotRef?.current || isCapturing) return;

    // 先顯示遮罩，等一個 frame 確保遮罩已渲染到畫面上，再做切屏
    setIsCapturing(true);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    // 強制桌面版型：暫時把 html 最小寬設為 container split breakpoint (1200px)
    // Container Query 依賴容器的實際渲染寬度，強制 html minWidth
    // 使 @container 父層寬度 >= 1200px，讓 @split: 類別生效
    const html = document.documentElement;
    const prevMinWidth = html.style.minWidth;
    html.style.minWidth = "2000px";
    // 等兩個 animation frame 確保 reflow 完成、computed style 已更新
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    try {
      const dataUrl = await domToPng(screenshotRef.current, {
        scale: 2,
        backgroundColor: '#000000',
      });
      const link = document.createElement("a");
      link.download = "tier-list.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("截圖失敗", err);
    } finally {
      // 還原，不影響行動版使用者的頁面排版
      html.style.minWidth = prevMinWidth;
      setIsCapturing(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;

    setIsSharing(true);
    try {
      // 呼叫分享邏輯，每次都建立新記錄
      const shareUrl = await shareToSupabase(state);

      // 複製到剪貼板
      await navigator.clipboard.writeText(shareUrl);

      // 顯示成功 Toast
      setToast({ message: "連結已複製！", type: "success" });
    } catch (error) {
      console.error("分享失敗:", error);
      setToast({ message: "分享失敗，請重試", type: "error" });
    } finally {
      setIsSharing(false);
    }
  };

  return (  
    <>
      {isCapturing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
          <span className="text-sm font-medium text-white">正在產生圖片…</span>
        </div>
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex w-full max-w-180 flex-col overflow-hidden rounded-md bg-white/60 p-2 @split:p-4 @split:max-w-210 @split:flex-none xl:w-245">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="下載圖片"
              onClick={handleDownload}
              disabled={isCapturing}
              className="flex h-10 items-center gap-1 rounded border border-zinc-400 bg-white px-2.5 text-sm text-zinc-700 transition hover:bg-zinc-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AiOutlineDownload className="text-base" />
              <span>{isCapturing ? "處理中…" : "下載"}</span>
            </button>
            <button
              type="button"
              title="分享"
              onClick={handleShare}
              disabled={isSharing}
              className="flex h-10 items-center gap-1 rounded border border-zinc-400 bg-white px-2.5 text-sm text-zinc-700 transition hover:bg-zinc-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AiOutlineShareAlt className="text-base" />
              <span>{isSharing ? "分享中…" : "分享"}</span>
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
        <div ref={screenshotRef} className="flex flex-col bg-transparent">
          {tiers.map((tier, index) => (
            <TierRow key={tier.id} tier={tier} items={items} onDeleteItem={onDeleteItem} showImageLabel={showImageLabel} isLast={index === tiers.length - 1} />
          ))}
        </div>
      </div>
    </>
  );
}

export default TierContainer;
