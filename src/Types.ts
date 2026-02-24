export type ItemId = string
export type TierId = string

export type Item = {
  id: ItemId
  content: string
  imageBase64?: string
  imageUrl?: string
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