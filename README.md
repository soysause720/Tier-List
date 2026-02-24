# TierList 製作器（由夯到拉）

## 1. 專案概述

一個可拖曳排序的 TierList 製作器，支援純文字與圖片項目，並可匯出為圖片。  
使用者可：

- 建立項目（文字 / 圖片 / 兩者兼具）
- 將項目拖曳至不同 Tier 或在同一 Tier 內重新排序
- 刪除項目
- 管理未排名項目（Unranked List）
- 切換是否顯示圖片名稱
- 下載 Tier List 為 PNG 圖片（固定電腦版型，不受裝置影響）
- 自動儲存至 localStorage，重整頁面不遺失

---

## 2. 技術選型

| 技術 | 用途 |
|------|------|
| TypeScript | 型別安全與資料模型設計 |
| React 19 | UI 架構（含 React Compiler） |
| Tailwind CSS v4 | 版面配置、RWD、Container Queries |
| dnd-kit | 拖曳排序功能 |
| modern-screenshot | DOM 截圖匯出 PNG |

---

## 3. 專案結構

```
src/
├── App.css               # Tailwind 入口、@theme container-split 定義
├── Types.ts              # 共用型別定義
├── component/
│   ├── ListWrapper.tsx   # 全域狀態（useReducer）、DnD Context、localStorage
│   ├── TierContainer.tsx # Tier 列表、截圖下載邏輯
│   ├── UnrankedList.tsx  # 未排名區塊
│   ├── SortableItem.tsx  # 可拖曳的 Item 包裝元件
│   ├── ItemComponent.tsx # Item 視覺呈現（文字卡 / 圖片卡）
│   └── CreateForm.tsx    # 新增 Item 表單（含圖片上傳與壓縮）
└── utils/
    └── dndIds.ts         # Droppable ID 命名與解析工具
```

---

## 4. 資料結構設計

```ts
export type ItemId = string
export type TierId = string

export type Item = {
  id: ItemId
  content: string
  imageUrl?: string       // Base64 JPEG，前端壓縮至 200×200
}

export type Tier = {
  id: TierId
  name: string
  color: string
  itemIds: ItemId[]
}

export type TierListState = {
  tiers: Tier[]
  items: Record<ItemId, Item>
  unrankedItemIds: ItemId[]
}
```

**設計說明**
- 採用 normalized state：`items` 使用 `Record` 儲存，提高查找效率
- Tier 與 UnrankedList 僅儲存 `itemIds`，不嵌套 Item 資料
- 所有 key 使用 `crypto.randomUUID()` 生成，不使用 index

---

## 5. 狀態管理

### 5.1 useReducer

所有狀態集中於 `ListWrapper`，使用 `useReducer` 管理：

```ts
type Action =
  | { type: "ADD_ITEM";     payload: { content: string; imageUrl?: string } }
  | { type: "DELETE_ITEM";  payload: { itemId: string } }
  | { type: "MOVE_ITEM";    payload: { itemId: string; from: string; to: string } }
  | { type: "REORDER_ITEM"; payload: { itemId: string; overId: string } }
```

### 5.2 localStorage 自動儲存

- `useEffect` 監聽 state 變動，自動序列化寫入 `localStorage`
- 初始化使用 lazy initializer：`loadFromStorage() ?? initialState`
- 讀取時通過 `isValidState()` 驗證結構，防止損壞資料造成崩潰
- 寫入失敗（空間不足等）靜默忽略，不中斷操作

---

## 6. RWD — Container Queries

版面使用 Tailwind v4 的 Container Query（而非 Viewport breakpoint），以 `split`（75rem / 1200px）為斷點：

```css
/* App.css */
@theme {
  --container-split: 75rem;
}
```

- 外層包裹 `@container`
- 子元素使用 `@split:flex-row`、`@split:text-3xl` 等類別
- **優點**：截圖時強制容器寬度即可觸發桌面版型，不依賴 viewport 大小

---

## 7. 功能規格

### 7.1 CreateForm

- 文字輸入與圖片上傳可單獨或同時使用（至少需一項才能新增）
- 圖片上傳後進行前端 center-crop + 縮放至 200×200 JPEG（品質 85%），減少 localStorage 占用
- 顯示圖片縮圖預覽，可單獨移除圖片
- 防止空白項目新增

### 7.2 ItemComponent

提供兩種卡片樣式：

| 類型 | 說明 |
|------|------|
| 圖片卡 | 固定正方形尺寸（手機 68px / 桌面 100px），含可切換的文字標籤 |
| 文字卡 | `inline-flex` 自適應寬度，`whitespace-nowrap` 防截圖時換行 |

### 7.3 刪除功能

- 桌面：Hover Item 顯示右上角 ✕ 按鈕
- 手機：點擊 Item 切換顯示 ✕ 按鈕（toggle）
- 拖曳開始時自動關閉 ✕ 按鈕
- 無 confirm 確認，即時刪除

---

## 8. Drag & Drop 行為規格

### 8.1 技術

- `DndContext` + `SortableContext`（`rectSortingStrategy`）
- `DragOverlay` 提供拖曳視覺層（拖曳中原位置顯示虛線佔位框）
- collision detection：優先使用 `pointerWithin`，fallback `closestCenter`，解決空容器左半邊偵測問題

### 8.2 Sensor 設定

| Sensor | 觸發條件 |
|--------|---------|
| PointerSensor | 移動距離 ≥ 8px |
| TouchSensor | 長按 150ms，容許偏移 8px |

### 8.3 支援行為

| 功能 | 狀態 |
|------|------|
| 同 Tier 內排序 | ✅ |
| 跨 Tier 移動 | ✅ |
| 放入空 Tier | ✅ |
| 放入 Unranked | ✅ |
| 拖曳範圍限制於 ListWrapper | ✅ |

### 8.4 拖曳邏輯

- `onDragOver` 即時 dispatch `MOVE_ITEM` / `REORDER_ITEM`
- `onDragEnd` 只負責清除 `activeId`（狀態已在 over 時即時更新）
- Drop ID 命名規則由 `utils/dndIds.ts` 統一管理

---

## 9. 截圖功能

### 技術：modern-screenshot（`domToPng`）

**截圖固定電腦版型的策略：**

Container Query 偵測的是容器元素的實際渲染寬度，截圖流程如下：

1. `setIsCapturing(true)` — 顯示全螢幕遮罩（半透明黑底 + backdrop-blur + spinner）
2. `await 1 frame` — 確保遮罩已渲染至畫面（對使用者隱藏後續切屏操作）
3. `html.style.minWidth = "2000px"` — 強制 `@container` 父層寬度 ≥ 1200px，觸發 `@split:` 類別
4. `await 2 frames` — 等待 reflow 完成
5. `domToPng(screenshotRef.current, { scale: 2 })` — 截取 tier rows 區域（不含工具列）
6. `finally`：還原 `html.style.minWidth`，移除遮罩

**截圖目標**：`screenshotRef` 掛載於 tier rows 包裝 div，輸出乾淨無 UI 的 PNG（`tier-list.png`）。

---

## 10. 實作分享連結功能

### 10.1 技術流程

- **本地編輯**：圖片存為 Base64（saveState localStorage）
- **按分享**：Base64 → File 上傳至 Supabase Storage → 取得 Public URL → 寫入資料庫
- **打開分享**：`/share/:id` 從資料庫拉資料 → 用同一個 UI 顯示

### 10.2 實現要點

**Supabase 設置：**
- Bucket：`upload-images`（Public）
- Table：`tier-lists`（欄位：id, data, created_at, updated_at）

**記憶體管理：**
- CreateForm 用 Blob 儲存圖片，使用 ObjectURL 預覽
- 提交時才轉 Base64，刪除時清理 ObjectURL

**防止覆蓋：**
```ts
// 本地模式：檢查 localStorage 中的 shareId，有則更新該筆記錄
// 分享模式：isSharedMode=true 時一律建立新記錄（防止 A 的分享被 B 覆蓋）
```

**路由設置：**
```tsx
<Route path="/" element={<ListWrapper />} />           // 本地編輯
<Route path="/share/:id" element={<ListWrapper />} />  // 分享檢視
```

**UX 細節：**
- 自動複製連結到剪貼板
- Toast 通知成功/失敗
- 分享期間 Button 停用顯示「分享中…」

### 10.3 環境變數

```
# .env.local（本地開發）
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Netlify：Site Settings > Build & deploy > Environment 中手動設置
```

## 11. 未來擴充方向

- 登入系統
- 建立子網頁展示其他人製作的Tier-List
- 雲端儲存與讀取 TierList
- Tier 可新增 / 刪除 / 自訂顏色
- 多人共用模式（長期目標）