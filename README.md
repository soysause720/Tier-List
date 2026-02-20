# TierList 製作器（由夯到拉）

## 1. 專案概述

本專案為一個可拖曳排序的 TierList 製作器。  
使用者可：

- 建立項目（Item）
- 將項目拖曳至不同 Tier
- 在同一 Tier 內重新排序
- 刪除項目
- 管理未排名項目（Unranked List）

本專案目標為完成一個結構清晰、可擴充、可作為作品集展示的 MVP 版本。

---

## 2. 技術選型

| 技術 | 用途 |
|------|------|
| TypeScript | 型別安全與資料模型設計 |
| React | UI 架構 |
| Tailwind CSS | 版面配置與 RWD |
| dnd-kit | 拖曳排序功能 |

---

## 3. 專案結構
src
├── component
│ ├── CreateForm.tsx
│ ├── ItemComponent.tsx
│ ├── ListWrapper.tsx
│ ├── TierContainer.tsx
│ ├── UnrankedList.tsx
├── type.ts


### 檔案說明

- **ListWrapper.tsx**  
  存放全域狀態，包裹整個 TierList 功能。

- **TierContainer.tsx**  
  呈現 Tierlist 區塊。

- **UnrankedList.tsx**  
  呈現未排名項目區塊。

- **ItemComponent.tsx**  
  單一 Item 元件。

- **CreateForm.tsx**  
  建立新 Item 的表單。

---

## 4. 資料結構設計
Type.ts的內文
```ts
export type ItemId = string
export type TierId = string

export type Item = {
  id: ItemId
  content: string
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
設計說明
採用 normalized state 設計
items 使用 Record 儲存，提高查找效率
Tier 僅儲存 itemIds
UnrankedList 使用 unrankedItemIds 管理
所有 key 必須使用穩定 id，不可使用 index

## 5. 狀態管理策略

### 5.1 由 useState 改為 useReducer

原先使用 `useState` 管理狀態，  
但隨著功能包含：

- 新增 Item
- 刪除 Item
- 跨 Tier 移動
- 同 Tier 內排序

屬於多行為型態的狀態操作，因此改用 `useReducer`。

---

### 5.2 使用 useReducer 的理由

- 集中管理所有狀態變更邏輯
- 使用 Action-based 架構讓行為清晰
- 易於除錯與追蹤
- 適合 drag-and-drop 複雜操作
- 未來可擴充 undo / redo
- 未來接後端時可整合資料同步流程

---

### 5.3 Reducer Action 設計

```ts
type Action =
  | { type: "ADD_ITEM"; payload: { content: string } }
  | { type: "DELETE_ITEM"; payload: { itemId: ItemId } }
  | { type: "MOVE_ITEM"; payload: { itemId: ItemId; from: string; to: string } }
  | { type: "REORDER_ITEM"; payload: { itemId: ItemId; overId: ItemId } }
  | { type: "LOAD_STATE"; payload: TierListState }
```
### 5.4 ID 生成策略

使用：
```ts
crypto.randomUUID()
```
原因：
- React key 需要穩定值
- 未來會接後端
- 避免排序錯亂
- 不需額外套件
- 確保 Item 在排序與刪除後仍能正確識別

## 6. 功能規格
### 6.1 CreateForm

功能說明：
- 左側為文字輸入欄位
- 右側為新增按鈕
- 不允許空字串新增

新增成功後：

- 建立新的 Item
- 將 ItemId 加入 unrankedItemIds
- 清空輸入欄

### 6.2 刪除功能
功能說明：
- 滑鼠 Hover Item 時顯示右上角刪除按鈕
- 點擊後立即刪除
- 不提供 confirm 機制
- 不提供 undo 功能
刪除行為需：
- 從 items 中移除該 Item
- 同時從所屬 Tier 或 unrankedItemIds 中移除該 id

## 7. Drag & Drop 行為規格
### 7.1 使用 dnd-kit
使用技術：
- DndContext
- SortableContext
- DragOverlay
- collision detection 採用 closestCenter

### 7.2 支援行為
| 功能          | 是否支援            |
| ----------- | --------------- |
| 同 Tier 內排序  | ✅               |
| 跨 Tier 移動   | ✅               |
| 放入空 Tier    | ✅               |
| 放入 Tier 標題區 | ❌               |
| 限制拖曳範圍      | 限制於 ListWrapper |

### 7.3 拖曳邏輯設計
- 每個 Tier 右側區域為獨立 Droppable 區域
- UnrankedList 為一個 Droppable 區域
- Tier 標題區不可放置 Item
- 拖曳範圍限制在 ListWrapper 內
- 使用 DragOverlay 提供拖曳視覺層

拖曳時需要處理兩種情況：
- 同容器排序（REORDER_ITEM）
- 跨容器移動（MOVE_ITEM）

## 8. 試作版 MVP 範圍
試作版完成條件:
- 新增 Item
- 刪除 Item
- 同 Tier 內排序
- 跨 Tier 移動
- 可放入空 Tier
- 使用 DragOverlay
- 使用 useReducer 管理狀態

## 9.1 圖片功能
未來 Item 結構預計改為：
```ts
type Item = {
  id: string
  content?: string
  imageUrl?: string
}
```
功能目標：
- 支援圖片上傳
- 自動調整圖片尺寸
- 使用 object-fit: cover
- 可切換是否顯示文字
- 圖片尺寸調整優先於前端處理。

### 9.2 截圖功能
需求：
- 輸出固定電腦版尺寸
- 不受使用者裝置影響

技術策略：
- 建立固定尺寸的 hidden container
- 使用 html2canvas
- 強制指定 scale
- 控制 devicePixelRatio

### 9.3 後端連接

未來將：
- 連接資料庫
- 支援儲存與讀取模板
- 支援自訂 Tier 標題與顏色
- 支援使用者帳號系統
- 支援分享功能

## 10. 未來擴充方向
- Tier 可新增 / 刪除
- Tier 顏色自訂
- localStorage 自動儲存
- 分享連結功能
- 圖片壓縮與雲端儲存
- 多人共用模式（長期目標）

## 11. 非功能性需求
- 支援手機拖曳
- 所有 key 必須使用穩定 id
- 不可使用 index 作為 key
- Tier 左側名稱區高度需填滿整個 Tier 容器
- UI 必須保持響應式設計
- 拖曳動畫需流暢且不卡頓

# 專案目標
建立一個：
- 結構清晰
- 可擴充
- 易維護
- 可作為作品集展示
- 的 TierList 製作工具。