"use client";

import { useState, useRef } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "ご飯を食べる", completed: false },
    { id: 2, text: "買い物リストを作る", completed: true },
  ]);
  const [input, setInput] = useState("");
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const touchFrom = useRef<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const addTodo = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setTodos((prev) => [...prev, { id: Date.now(), text: trimmed, completed: false }]);
    setInput("");
  };

  const toggleTodo = (id: number) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTodo = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Mouse drag (PC) ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (!isNaN(from) && from !== index) reorder(from, index);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => setDragOverIndex(null);

  // --- Touch drag (スマホ) ---
  const getIndexFromTouch = (touch: React.Touch): number | null => {
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const li = el?.closest("li");
    if (!li || !listRef.current) return null;
    return Array.from(listRef.current.children).indexOf(li);
  };

  const handleTouchStart = (index: number) => {
    touchFrom.current = index;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const over = getIndexFromTouch(e.touches[0]);
    setDragOverIndex(over);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const to = getIndexFromTouch(e.changedTouches[0]);
    if (touchFrom.current !== null && to !== null && touchFrom.current !== to) {
      reorder(touchFrom.current, to);
    }
    touchFrom.current = null;
    setDragOverIndex(null);
  };

  const reorder = (from: number, to: number) => {
    setTodos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const remaining = todos.filter((t) => !t.completed).length;
  const completed = todos.filter((t) => t.completed).length;
  const rate = todos.length === 0 ? 0 : Math.round((completed / todos.length) * 100);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">ToDo</h1>
          <p className="mt-1 text-sm text-slate-400">
            残り <span className="font-semibold text-slate-600">{remaining}</span> 件
          </p>
          {todos.length > 0 && (
            <div className="mt-4 mx-auto w-48">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>達成率</span>
                <span className="font-semibold text-slate-600">{rate}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Input area */}
          <div className="flex items-center gap-2 p-4 border-b border-slate-100">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="新しいタスクを入力..."
              className="flex-1 text-sm text-slate-700 placeholder-slate-300 outline-none bg-transparent"
            />
            <button
              onClick={addTodo}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors shrink-0"
              aria-label="追加"
            >
              +
            </button>
          </div>

          {/* Todo list */}
          {todos.length === 0 ? (
            <div className="py-16 text-center text-slate-300 text-sm">
              タスクがありません
            </div>
          ) : (
            <ul ref={listRef}>
              {todos.map((todo, index) => (
                <li
                  key={todo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={() => handleTouchStart(index)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`flex items-center gap-3 px-4 py-3 group transition-colors cursor-grab active:cursor-grabbing select-none ${
                    index !== todos.length - 1 ? "border-b border-slate-100" : ""
                  } ${
                    dragOverIndex === index
                      ? "bg-emerald-50 border-t-2 border-t-emerald-400"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {/* Drag handle */}
                  <span className="shrink-0 text-slate-200 group-hover:text-slate-300 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="7" cy="5" r="1.5" />
                      <circle cx="13" cy="5" r="1.5" />
                      <circle cx="7" cy="10" r="1.5" />
                      <circle cx="13" cy="10" r="1.5" />
                      <circle cx="7" cy="15" r="1.5" />
                      <circle cx="13" cy="15" r="1.5" />
                    </svg>
                  </span>

                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      todo.completed
                        ? "bg-emerald-400 border-emerald-400"
                        : "border-slate-300 hover:border-slate-400"
                    }`}
                    aria-label={todo.completed ? "未完了に戻す" : "完了にする"}
                  >
                    {todo.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Text */}
                  <span
                    className={`flex-1 text-sm leading-relaxed transition-colors ${
                      todo.completed ? "line-through text-slate-300" : "text-slate-700"
                    }`}
                  >
                    {todo.text}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="削除"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Footer */}
          {todos.some((t) => t.completed) && (
            <div className="px-4 py-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setTodos((prev) => prev.filter((t) => !t.completed))}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors"
              >
                完了済みをすべて削除
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
