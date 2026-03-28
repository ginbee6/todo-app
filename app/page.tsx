"use client";

import { useState, useRef, useEffect } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
  tab: string;
};

export default function Home() {
  const [tabs, setTabs] = useState<string[]>(() => {
    if (typeof window === "undefined") return ["1", "2"];
    try { return JSON.parse(localStorage.getItem("tabs") ?? "") } catch { return ["1", "2"]; }
  });
  const [activeTab, setActiveTab] = useState<string>("すべて");
  const [todos, setTodos] = useState<Todo[]>(() => {
    if (typeof window === "undefined") return [
      { id: 1, text: "ご飯を食べる", completed: false, tab: "1" },
      { id: 2, text: "買い物リストを作る", completed: true, tab: "1" },
    ];
    try { return JSON.parse(localStorage.getItem("todos") ?? "") } catch {
      return [
        { id: 1, text: "ご飯を食べる", completed: false, tab: "1" },
        { id: 2, text: "買い物リストを作る", completed: true, tab: "1" },
      ];
    }
  });

  useEffect(() => { localStorage.setItem("tabs", JSON.stringify(tabs)); }, [tabs]);
  useEffect(() => { localStorage.setItem("todos", JSON.stringify(todos)); }, [todos]);
  const [input, setInput] = useState("");
  const [newTabInput, setNewTabInput] = useState("");
  const [addingTab, setAddingTab] = useState(false);
  const [renamingTab, setRenamingTab] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // スワイプ用
  const [swipingTab, setSwipingTab] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const swipeXRef = useRef(0);
  const tabPointerStart = useRef<{ x: number; width: number } | null>(null);

  // タイマー
  const [timerActive, setTimerActive] = useState(false);
  const [timerSec, setTimerSec] = useState(180);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerSec(180);
    setTimerActive(true);
    timerRef.current = setInterval(() => {
      setTimerSec((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setTimerActive(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTimerActive(false);
    setTimerSec(180);
  };

  // タスク並び替え用
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const touchFrom = useRef<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const visibleTodos = activeTab === "すべて"
    ? todos
    : todos.filter((t) => t.tab === activeTab);

  const addTodo = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (trimmed === "タイマー起動") { startTimer(); setInput(""); return; }
    if (trimmed === "タイマー終了") { stopTimer(); setInput(""); return; }
    setTodos((prev) => [...prev, {
      id: Date.now(), text: trimmed, completed: false,
      tab: activeTab === "すべて" ? (tabs[0] ?? "1") : activeTab,
    }]);
    setInput("");
  };

  const toggleTodo = (id: number) =>
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));

  const deleteTodo = (id: number) =>
    setTodos((prev) => prev.filter((t) => t.id !== id));

  const addTab = () => {
    const name = newTabInput.trim();
    if (!name || tabs.includes(name)) return;
    setTabs((prev) => [...prev, name]);
    setActiveTab(name);
    setNewTabInput("");
    setAddingTab(false);
  };

  const deleteTab = (tab: string) => {
    setTabs((prev) => prev.filter((t) => t !== tab));
    setTodos((prev) => prev.filter((t) => t.tab !== tab));
    if (activeTab === tab) setActiveTab("すべて");
  };

  const renameTab = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || (tabs.includes(trimmed) && trimmed !== oldName)) return;
    setTabs((prev) => prev.map((t) => t === oldName ? trimmed : t));
    setTodos((prev) => prev.map((t) => t.tab === oldName ? { ...t, tab: trimmed } : t));
    if (activeTab === oldName) setActiveTab(trimmed);
    setRenamingTab(null);
  };

  // ── タブスワイプ ──
  const handleTabPointerDown = (e: React.PointerEvent, tab: string) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    tabPointerStart.current = { x: e.clientX, width: (e.currentTarget as HTMLElement).offsetWidth };
    swipeXRef.current = 0;
    setSwipingTab(tab);
    setSwipeX(0);
  };

  const handleTabPointerMove = (e: React.PointerEvent) => {
    if (!tabPointerStart.current) return;
    const dx = e.clientX - tabPointerStart.current.x; // 正=右、負=左
    swipeXRef.current = dx;
    setSwipeX(dx);
  };

  const handleTabPointerUp = (tab: string) => {
    if (tabPointerStart.current) {
      const w = tabPointerStart.current.width;
      if (swipeXRef.current >= w * 0.6) {
        // 右スワイプ → 削除
        deleteTab(tab);
      } else if (swipeXRef.current <= -w * 0.6) {
        // 左スワイプ → 名称変更
        setRenamingTab(tab);
        setRenameValue(tab);
      } else {
        setActiveTab(tab);
      }
    }
    tabPointerStart.current = null;
    swipeXRef.current = 0;
    setSwipingTab(null);
    setSwipeX(0);
  };

  const resetSwipe = () => {
    tabPointerStart.current = null;
    swipeXRef.current = 0;
    setSwipingTab(null);
    setSwipeX(0);
  };

  // ── タスク並び替え ──
  const reorder = (from: number, to: number) => {
    setTodos((prev) => {
      const ids = visibleTodos.map((t) => t.id);
      const reordered = [...ids];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      return reordered.map((id) => prev.find((t) => t.id === id)!).concat(
        prev.filter((t) => !ids.includes(t.id))
      );
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (!isNaN(from) && from !== index) reorder(from, index);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => setDragOverIndex(null);

  const getIndexFromTouch = (touch: React.Touch): number | null => {
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const li = el?.closest("li");
    if (!li || !listRef.current) return null;
    return Array.from(listRef.current.children).indexOf(li);
  };
  const handleTouchStart = (index: number) => { touchFrom.current = index; };
  const handleTouchMove = (e: React.TouchEvent) => { setDragOverIndex(getIndexFromTouch(e.touches[0])); };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const to = getIndexFromTouch(e.changedTouches[0]);
    if (touchFrom.current !== null && to !== null && touchFrom.current !== to) reorder(touchFrom.current, to);
    touchFrom.current = null;
    setDragOverIndex(null);
  };

  const remaining = visibleTodos.filter((t) => !t.completed).length;
  const completedCount = visibleTodos.filter((t) => t.completed).length;
  const rate = visibleTodos.length === 0 ? 0 : Math.round((completedCount / visibleTodos.length) * 100);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* タイマー */}
        {timerActive && (
          <div className="mb-4 flex items-center justify-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke={timerSec <= 30 ? "#f87171" : "#34d399"}
                  strokeWidth="3"
                  strokeDasharray={`${(timerSec / 180) * 100} 100`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className={`text-2xl font-bold tabular-nums tracking-tight ${timerSec <= 30 ? "text-red-400" : "text-slate-700"}`}>
              {String(Math.floor(timerSec / 60)).padStart(2, "0")}:{String(timerSec % 60).padStart(2, "0")}
            </span>
            <button onClick={stopTimer} className="ml-1 text-xs text-slate-300 hover:text-slate-500 transition-colors">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">ToDo</h1>
          <p className="mt-1 text-sm text-slate-400">
            残り <span className="font-semibold text-slate-600">{remaining}</span> 件
          </p>
          {visibleTodos.length > 0 && (
            <div className="mt-4 mx-auto w-48">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>達成率</span>
                <span className="font-semibold text-slate-600">{rate}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${rate}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">

          {/* すべて */}
          <button
            onClick={() => setActiveTab("すべて")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === "すべて" ? "bg-slate-800 text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
            }`}
          >
            すべて
          </button>

          {/* カスタムタブ */}
          {tabs.map((tab) => {
            if (renamingTab === tab) {
              return (
                <div key={tab} className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameTab(tab, renameValue);
                      if (e.key === "Escape") setRenamingTab(null);
                    }}
                    onBlur={() => renameTab(tab, renameValue)}
                    className="w-20 px-2 py-1.5 text-xs border border-slate-300 rounded-full outline-none focus:border-emerald-400"
                  />
                </div>
              );
            }

            const isSwiping = swipingTab === tab;
            const dx = isSwiping ? swipeX : 0;
            const w = tabPointerStart.current?.width ?? 1;
            const rightProgress = Math.min(Math.max(dx, 0) / (w * 0.6), 1);
            const leftProgress  = Math.min(Math.max(-dx, 0) / (w * 0.6), 1);
            const isDeleteReady = rightProgress >= 1;
            const isRenameReady = leftProgress >= 1;

            return (
              <button
                key={tab}
                onPointerDown={(e) => handleTabPointerDown(e, tab)}
                onPointerMove={handleTabPointerMove}
                onPointerUp={() => handleTabPointerUp(tab)}
                onPointerCancel={resetSwipe}
                style={isSwiping ? { transform: `translateX(${dx}px)`, transition: "none" } : {}}
                className={`px-3 py-1.5 rounded-full text-xs font-medium touch-none select-none transition-colors ${
                  isDeleteReady
                    ? "bg-red-400 text-white"
                    : isRenameReady
                    ? "bg-emerald-400 text-white"
                    : activeTab === tab
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-500 border border-slate-200"
                }`}
              >
                {isDeleteReady ? "🗑 削除" : isRenameReady ? "✏️ 名称変更" : tab}
                {!isDeleteReady && !isRenameReady && (
                  <span className={`ml-1 ${activeTab === tab ? "text-slate-300" : "text-slate-400"}`}>
                    ({todos.filter((t) => t.tab === tab).length})
                  </span>
                )}
              </button>
            );
          })}

          {/* タブ追加 */}
          {addingTab ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={newTabInput}
                onChange={(e) => setNewTabInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addTab(); if (e.key === "Escape") setAddingTab(false); }}
                placeholder="タブ名"
                className="w-20 px-2 py-1.5 text-xs border border-slate-300 rounded-full outline-none focus:border-slate-400"
              />
              <button onClick={addTab} className="px-2 py-1.5 text-xs bg-slate-800 text-white rounded-full">追加</button>
              <button onClick={() => setAddingTab(false)} className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setAddingTab(true)}
              className="px-3 py-1.5 rounded-full text-xs text-slate-400 border border-dashed border-slate-200 hover:border-slate-300 hover:text-slate-500 transition-all"
            >
              + タブを追加
            </button>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-slate-100">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeTab === "すべて" ? `新しいタスクを入力 (→ ${tabs[0] ?? "1"})` : `${activeTab}にタスクを追加...`}
              className="flex-1 text-sm text-slate-700 placeholder-slate-300 outline-none bg-transparent"
            />
            <button
              onClick={addTodo}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors shrink-0"
              aria-label="追加"
            >+</button>
          </div>

          {visibleTodos.length === 0 ? (
            <div className="py-16 text-center text-slate-300 text-sm">タスクがありません</div>
          ) : (
            <ul ref={listRef}>
              {visibleTodos.map((todo, index) => (
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
                    index !== visibleTodos.length - 1 ? "border-b border-slate-100" : ""
                  } ${dragOverIndex === index ? "bg-emerald-50 border-t-2 border-t-emerald-400" : "hover:bg-slate-50"}`}
                >
                  <span className="shrink-0 text-slate-200 group-hover:text-slate-300 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="7" cy="5" r="1.5" /><circle cx="13" cy="5" r="1.5" />
                      <circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" />
                      <circle cx="7" cy="15" r="1.5" /><circle cx="13" cy="15" r="1.5" />
                    </svg>
                  </span>
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      todo.completed ? "bg-emerald-400 border-emerald-400" : "border-slate-300 hover:border-slate-400"
                    }`}
                    aria-label={todo.completed ? "未完了に戻す" : "完了にする"}
                  >
                    {todo.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`flex-1 text-sm leading-relaxed transition-colors ${todo.completed ? "line-through text-slate-300" : "text-slate-700"}`}>
                    {todo.text}
                  </span>
                  {activeTab === "すべて" && (
                    <span className="text-xs text-slate-300 shrink-0">{todo.tab}</span>
                  )}
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

          {visibleTodos.some((t) => t.completed) && (
            <div className="px-4 py-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  const ids = visibleTodos.filter((t) => t.completed).map((t) => t.id);
                  setTodos((prev) => prev.filter((t) => !ids.includes(t.id)));
                }}
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
