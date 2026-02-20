import type { Item } from "../Types";

type ItemComponentProps = {
  item: Item;
  onDelete?: (itemId: string) => void;
};

function ItemComponent({ item, onDelete }: ItemComponentProps) {
  return (
    <div className="group relative inline-flex max-w-full items-center justify-center rounded border border-zinc-300 bg-white px-3 py-2 text-base font-medium text-zinc-900 shadow-sm split:px-4 split:py-2.5 split:text-2xl">
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-zinc-300 bg-white text-xs leading-none text-zinc-700 shadow-sm transition hover:bg-red-500 hover:text-white group-hover:flex"
          aria-label={`刪除 ${item.content}`}
        >
          ×
        </button>
      )}
      <span>{item.content}</span>
    </div>
  );
}

export default ItemComponent;
