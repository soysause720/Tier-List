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
  imageBase64?: string    // 本地編輯時：前端壓縮至 200×200 WebP
  imageUrl?: string       // 分享時：Supabase Public URL
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
  | { type: "ADD_ITEM";           payload: { content: string; imageBase64?: string } }
  | { type: "DELETE_ITEM";        payload: { itemId: string } }
  | { type: "MOVE_ITEM";          payload: { itemId: string; from: string; to: string } }
  | { type: "REORDER_ITEM";       payload: { itemId: string; overId: string } }
  | { type: "LOAD_SHARED_STATE"; payload: TierListState }
```

### 5.2 localStorage 自動儲存

- `useEffect` 監聽 state 變動，自動序列化寫入 `localStorage`
- **分享模式隔離**：當 `isViewingSharedList` 為 true（URL 包含 `/share/:id`）時，跳過 localStorage 寫入
- 初始化使用 lazy initializer：`loadFromStorage() ?? initialState`
- 讀取時通過 `isValidState()` 驗證結構，防止損壞資料造成崩潰
- 寫入失敗（空間不足等）靜默忽略，不中斷操作
- 防止多視窗間的分享連結污染本地編輯版本

---

## 6. RWD — Container Queries

版面使用 Tailwind v4 的 Container Query（而非 Viewport breakpoint），以 `split`（70rem / 1120px）為斷點：

```css
/* App.css */
@theme {
  --container-split: 70rem;
}
```

- 外層包裹 `@container`
- 子元素使用 `@split:flex-row`、`@split:text-3xl` 等類別
- **優點**：截圖時強制容器寬度即可觸發桌面版型，不依賴 viewport 大小

---

## 7. 功能規格

### 7.1 CreateForm

- 文字輸入與圖片上傳可單獨或同時使用（至少需一項才能新增）
- 圖片上傳後進行前端 center-crop + 縮放至 200×200 WebP（品質 80%），減少 localStorage 占用
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

分享流程採用「一次分享建立一份記錄」的設計，支援使用者製作多份表單各自分享：

1. **本地編輯模式**
   - 圖片以 Base64 編碼儲存至 `Item.imageBase64`
   - 自動同步到 localStorage（`tier-list-state` key）

2. **按下分享按鈕**
   - 上傳所有 Base64 圖片至 Supabase Storage → 取得 Public URL
   - 檢查 Item 資料：將 `imageBase64` 刪除，以 `imageUrl` 替換
   - **每次都建立新的資料庫記錄**（不覆蓋舊分享）
   - 返回唯一的分享連結並自動複製到剪貼板

3. **打開分享連結 `/share/:id`**
   - 從資料庫查詢記錄，拉取完整的 TierListState
   - 載入至 state 並顯示（圖片以 `imageUrl` 讀取）
   - **分享模式不寫入 localStorage**，防止污染本地編輯版本

### 10.2 資料模型

Item 類型同時支援兩種圖片格式：

```ts
export type Item = {
  id: ItemId
  content: string
  imageBase64?: string   // 本地編輯時：Blob 轉 Base64，前端壓縮至 200×200
  imageUrl?: string      // 分享時：Supabase Public URL
}
```

分享前後的轉換過程：
```
本地編輯         分享轉換           資料庫儲存         分享檢視
imageBase64  →  移除 Base64   →   imageUrl     →   渲染 imageUrl
               上傳圖片儲存
```

### 10.3 實現要點

**Supabase 設置：**
- Bucket：`upload-images`（Public，無 RLS）
- Table：`tier-lists`（欄位：id, data, created_at, updated_at）
- 存儲路徑：`tierlist-{UUID}/{itemId}.webp`（每份分享用唯一資料夾區隔）

**記憶體管理：**
- CreateForm 用 Blob 臨時儲存圖片，以 `URL.createObjectURL()` 預覽
- 提交新增時才轉 Base64 寫入 state（減少記憶體占用）
- 使用者點刪除時清理 ObjectURL（`URL.revokeObjectURL()`）

**分享模式隔離 localStorage：**
- 新增 `isViewingSharedList` state 追蹤當前模式
- localStorage useEffect 檢查：分享模式下跳過寫入
- 依賴陣列：`[state, isViewingSharedList]`
- 防止不同視窗的分享連結互相污染本地版本

**路由設置：**
```tsx
<Route path="/" element={<ListWrapper />} />           // 本地編輯模式
<Route path="/share/:id" element={<ListWrapper />} />  // 分享檢視模式
```

兩個路由共用相同元件，透過 `useParams()` 判斷模式。

**UX 細節：**
- ✅ 自動複製分享連結到剪貼板
- ✅ Toast 通知：成功「連結已複製！」/ 失敗「分享失敗，請重試」
- ✅ 分享期間 Button 停用，顯示「分享中…」加載狀態
- ✅ 分享連結無時限，永久有效

### 10.4 數據庫初始化

部署前需在 Supabase 執行以下 SQL，開啟資料表和存儲桶的行級安全性 (RLS)：

**tier-lists 表的 RLS 策略：**
```sql
-- 開啟 RLS 功能
alter table public.tier_lists enable row level security;

-- 允許匿名使用者讀取 (SELECT)
create policy "Allow public read access"
on public.tier_lists for select
to anon
using (true);

-- 允許匿名使用者新增 (INSERT)
create policy "Allow public insert access"
on public.tier_lists for insert
to anon
with check (true);
```

**upload-images 存儲桶的 RLS 策略：**
```sql
-- 允許匿名使用者讀取存儲桶中的檔案
create policy "Public Access"
on storage.objects for select
to anon
using ( bucket_id = 'upload-images' );

-- 允許匿名使用者上傳檔案到存儲桶
create policy "Public Upload"
on storage.objects for insert
to anon
with check ( bucket_id = 'upload-images' );
```

**執行步驟：**
1. 進入 Supabase 控制台 → SQL Editor
2. 複製上述 SQL 並執行
3. 確認無錯誤訊息即可

### 10.5 環境變數

```
# .env.local（本地開發）
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Netlify：Site Settings > Build & deploy > Environment 中手動設置相同變數
```

### 10.6 多視窗場景

此架構的優勢：

| 場景 | 行為 |
|------|------|
| 分頁 A 本地編輯 → 分頁 B 打開分享 | localStorage 獨立，互不干擾 ✅ |
| 分頁 B 重整分享頁 | 從資料庫重新查詢，本地版本保留 ✅ |
| 製作第二份表單並分享 | 新建獨立記錄，產生新連結 ✅ |
| 多人分享到同一群組 | 每人的分享各自獨立，無衝突 ✅ |

## 11. 未來擴充方向

- 登入系統
- 建立子網頁展示其他人製作的Tier-List
- 雲端儲存與讀取 TierList
- Tier 可新增 / 刪除 / 自訂顏色
- 多人共用模式（長期目標）