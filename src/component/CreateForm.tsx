import { useState } from "react";

type CreateFormProps = {
  onAddItem: (content: string) => void;
};

function CreateForm({ onAddItem }: CreateFormProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "") return;
    onAddItem(input.trim());
    setInput("");
  };

  return (
    <form className="mb-1 flex w-full min-w-0 items-center gap-2" onSubmit={handleSubmit}>
      <input
        className="min-w-0 flex-1 rounded border border-zinc-400 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-600 md:text-base"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="輸入新項目..."
      />
      <button
        className="h-10 shrink-0 rounded bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
        type="submit"
        disabled={input.trim() === ""}
      >
        新增
      </button>
    </form>
  );
}

export default CreateForm;
