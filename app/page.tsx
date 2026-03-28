"use client";

import { useState, useRef, useEffect } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
  tab: string;
};

const NEONS = [
  { color: "#ff2d78", bg: "#110008", glow: "rgba(255,45,120,0.4)" },
  { color: "#00f5ff", bg: "#000f11", glow: "rgba(0,245,255,0.4)" },
  { color: "#39ff14", bg: "#011100", glow: "rgba(57,255,20,0.4)"  },
  { color: "#bf5fff", bg: "#0a0011", glow: "rgba(191,95,255,0.4)" },
  { color: "#ff9500", bg: "#110500", glow: "rgba(255,149,0,0.4)"  },
];

export default function Home() {
  const [neonIdx, setNeonIdx] = useState(0);
  const [isNeon, setIsNeon] = useState(true);
  const neon = NEONS[neonIdx];

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
  const [swipingTab, setSwipingTab] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const swipeXRef = useRef(0);
  const tabPointerStart = useRef<{ x: number; width: number } | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSec, setTimerSec] = useState(180);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const touchFrom = useRef<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const visibleTodos = activeTab === "すべて" ? todos : todos.filter((t) => t.tab === activeTab);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerSec(180); setTimerActive(true);
    timerRef.current = setInterval(() => {
      setTimerSec((s) => {
        if (s <= 1) { clearInterval(timerRef.current!); timerRef.current = null; setTimerActive(false); return 0; }
        return s - 1;
      });
    }, 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTimerActive(false); setTimerSec(180);
  };

  const addTodo = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (trimmed === "タイマー起動") { startTimer(); setInput(""); return; }
    if (trimmed === "タイマー終了") { stopTimer(); setInput(""); return; }
    if (trimmed === "カラー変更") { setIsNeon(true); setNeonIdx((i) => (i + 1) % NEONS.length); setInput(""); return; }
    if (trimmed === "ネオンカラーやめる") { setIsNeon(false); setInput(""); return; }
    setTodos((prev) => [...prev, { id: Date.now(), text: trimmed, completed: false, tab: activeTab === "すべて" ? (tabs[0] ?? "1") : activeTab }]);
    setInput("");
  };

  const toggleTodo = (id: number) => setTodos((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTodo = (id: number) => setTodos((prev) => prev.filter((t) => t.id !== id));

  const addTab = () => {
    const name = newTabInput.trim();
    if (!name || tabs.includes(name)) return;
    setTabs((prev) => [...prev, name]); setActiveTab(name); setNewTabInput(""); setAddingTab(false);
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

  const handleTabPointerDown = (e: React.PointerEvent, tab: string) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    tabPointerStart.current = { x: e.clientX, width: (e.currentTarget as HTMLElement).offsetWidth };
    swipeXRef.current = 0; setSwipingTab(tab); setSwipeX(0);
  };
  const handleTabPointerMove = (e: React.PointerEvent) => {
    if (!tabPointerStart.current) return;
    const dx = e.clientX - tabPointerStart.current.x;
    swipeXRef.current = dx; setSwipeX(dx);
  };
  const handleTabPointerUp = (tab: string) => {
    if (tabPointerStart.current) {
      const w = tabPointerStart.current.width;
      if (swipeXRef.current >= w * 0.6) deleteTab(tab);
      else if (swipeXRef.current <= -w * 0.6) { setRenamingTab(tab); setRenameValue(tab); }
      else setActiveTab(tab);
    }
    tabPointerStart.current = null; swipeXRef.current = 0; setSwipingTab(null); setSwipeX(0);
  };
  const resetSwipe = () => { tabPointerStart.current = null; swipeXRef.current = 0; setSwipingTab(null); setSwipeX(0); };

  const reorder = (from: number, to: number) => {
    setTodos((prev) => {
      const ids = visibleTodos.map((t) => t.id);
      const reordered = [...ids];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      return reordered.map((id) => prev.find((t) => t.id === id)!).concat(prev.filter((t) => !ids.includes(t.id)));
    });
  };
  const handleDragStart = (e: React.DragEvent, index: number) => { e.dataTransfer.setData("text/plain", String(index)); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDrop = (e: React.DragEvent, index: number) => { e.preventDefault(); const from = Number(e.dataTransfer.getData("text/plain")); if (!isNaN(from) && from !== index) reorder(from, index); setDragOverIndex(null); };
  const handleDragEnd = () => setDragOverIndex(null);
  const getIndexFromTouch = (touch: React.Touch): number | null => { const el = document.elementFromPoint(touch.clientX, touch.clientY); const li = el?.closest("li"); if (!li || !listRef.current) return null; return Array.from(listRef.current.children).indexOf(li); };
  const handleTouchStart = (index: number) => { touchFrom.current = index; };
  const handleTouchMove = (e: React.TouchEvent) => { setDragOverIndex(getIndexFromTouch(e.touches[0])); };
  const handleTouchEnd = (e: React.TouchEvent) => { const to = getIndexFromTouch(e.changedTouches[0]); if (touchFrom.current !== null && to !== null && touchFrom.current !== to) reorder(touchFrom.current, to); touchFrom.current = null; setDragOverIndex(null); };

  const remaining = visibleTodos.filter((t) => !t.completed).length;
  const completedCount = visibleTodos.filter((t) => t.completed).length;
  const rate = visibleTodos.length === 0 ? 0 : Math.round((completedCount / visibleTodos.length) * 100);

  const c     = isNeon ? neon.color : "#1e293b";
  const cGlow = isNeon ? neon.glow  : "transparent";
  const bgMain    = isNeon ? `radial-gradient(ellipse at 50% 0%, ${neon.glow} 0%, ${neon.bg} 60%)` : "linear-gradient(135deg, #f8fafc, #f1f5f9)";
  const cardBg    = isNeon ? "rgba(0,0,0,0.55)" : "#ffffff";
  const cardBorder= isNeon ? c : "#e2e8f0";
  const cardShadow= isNeon ? `0 0 30px ${cGlow}, inset 0 0 30px rgba(0,0,0,0.3)` : "0 1px 3px rgba(0,0,0,0.06)";
  const textMain  = isNeon ? "rgba(255,255,255,0.85)" : "#334155";
  const textMuted = isNeon ? "rgba(255,255,255,0.4)" : "#94a3b8";
  const divider   = isNeon ? "1px solid rgba(255,255,255,0.07)" : "1px solid #f1f5f9";
  const tabActive = isNeon ? { background: c, color: "#000", boxShadow: `0 0 12px ${cGlow}` } : { background: "#1e293b", color: "#fff" };
  const tabInactive= isNeon ? { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" } : { background: "#fff", color: "#64748b", border: "1px solid #e2e8f0" };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 transition-all duration-700"
      style={{ background: bgMain }}
    >
      <style>{`
        @keyframes neon-pulse { 0%,100%{opacity:1} 50%{opacity:.7} }
        .neon-title { animation: neon-pulse 2s ease-in-out infinite; }
      `}</style>

      <div className="w-full max-w-md">

        {/* タイマー */}
        {timerActive && (
          <div className="mb-4 flex items-center justify-center gap-3 rounded-2xl px-5 py-3 border"
            style={{ background: cardBg, borderColor: cardBorder, boxShadow: cardShadow }}>
            <div className="w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={timerSec <= 30 ? "#ff2d78" : c} strokeWidth="3"
                  strokeDasharray={`${(timerSec / 180) * 100} 100`} strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-2xl font-bold tabular-nums" style={{ color: timerSec <= 30 ? "#ff2d78" : c, textShadow: `0 0 10px ${timerSec <= 30 ? "#ff2d78" : c}` }}>
              {String(Math.floor(timerSec / 60)).padStart(2, "0")}:{String(timerSec % 60).padStart(2, "0")}
            </span>
            <button onClick={stopTimer} className="ml-1 text-xs transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>✕</button>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className={isNeon ? "neon-title text-4xl font-bold tracking-widest" : "text-3xl font-bold tracking-tight"} style={{ color: c, textShadow: isNeon ? `0 0 20px ${c}, 0 0 40px ${cGlow}` : "none" }}>ToDo</h1>
          <p className="mt-1 text-xs" style={{ color: textMuted }}>
            残り <span className="font-bold" style={{ color: c }}>{remaining}</span> 件
          </p>
          {visibleTodos.length > 0 && (
            <div className="mt-4 mx-auto w-48">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: textMuted }}>
                <span>達成率</span>
                <span className="font-bold" style={{ color: c }}>{rate}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isNeon ? "rgba(255,255,255,0.1)" : "#f1f5f9" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${rate}%`, background: c, boxShadow: `0 0 8px ${c}` }} />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <button
            onClick={() => setActiveTab("すべて")}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={activeTab === "すべて" ? tabActive : tabInactive}
          >すべて</button>

          {tabs.map((tab) => {
            if (renamingTab === tab) return (
              <div key={tab} className="flex items-center gap-1">
                <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") renameTab(tab, renameValue); if (e.key === "Escape") setRenamingTab(null); }}
                  onBlur={() => renameTab(tab, renameValue)}
                  className="w-20 px-2 py-1.5 text-xs rounded-full outline-none"
                  style={{ background: "rgba(0,0,0,0.5)", color: "#fff", border: `1px solid ${c}` }} />
              </div>
            );

            const isSwiping = swipingTab === tab;
            const dx = isSwiping ? swipeX : 0;
            const w = tabPointerStart.current?.width ?? 1;
            const isDeleteReady = dx >= w * 0.6;
            const isRenameReady = dx <= -w * 0.6;

            return (
              <button key={tab}
                onPointerDown={(e) => handleTabPointerDown(e, tab)}
                onPointerMove={handleTabPointerMove}
                onPointerUp={() => handleTabPointerUp(tab)}
                onPointerCancel={resetSwipe}
                style={{
                  transform: isSwiping ? `translateX(${dx}px)` : undefined,
                  transition: isSwiping ? "none" : undefined,
                  ...(isDeleteReady
                    ? { background: "#ff2d78", color: "#fff", boxShadow: isNeon ? "0 0 12px rgba(255,45,120,0.6)" : "none" }
                    : isRenameReady
                    ? { background: "#39ff14", color: "#000", boxShadow: isNeon ? "0 0 12px rgba(57,255,20,0.6)" : "none" }
                    : activeTab === tab ? tabActive : tabInactive),
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium touch-none select-none"
              >
                {isDeleteReady ? "🗑 削除" : isRenameReady ? "✏️ 変更" : tab}
                {!isDeleteReady && !isRenameReady && (
                  <span className="ml-1 opacity-50">({todos.filter((t) => t.tab === tab).length})</span>
                )}
              </button>
            );
          })}

          {addingTab ? (
            <div className="flex items-center gap-1">
              <input autoFocus value={newTabInput} onChange={(e) => setNewTabInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addTab(); if (e.key === "Escape") setAddingTab(false); }}
                placeholder="タブ名" className="w-20 px-2 py-1.5 text-xs rounded-full outline-none"
                style={{ background: "rgba(0,0,0,0.5)", color: "#fff", border: `1px solid ${c}` }} />
              <button onClick={addTab} className="px-2 py-1.5 text-xs rounded-full font-medium" style={{ background: c, color: "#000" }}>追加</button>
              <button onClick={() => setAddingTab(false)} className="px-2 py-1.5 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setAddingTab(true)} className="px-3 py-1.5 rounded-full text-xs transition-all"
              style={{ color: "rgba(255,255,255,0.3)", border: `1px dashed rgba(255,255,255,0.15)` }}>
              + タブを追加
            </button>
          )}
        </div>

        {/* Card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow }}>
          <div className="flex items-center gap-2 p-4" style={{ borderBottom: divider }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={activeTab === "すべて" ? `新しいタスクを入力 (→ ${tabs[0] ?? "1"})` : `${activeTab}にタスクを追加...`}
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: textMain }} />
            <button onClick={addTodo} disabled={!input.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold leading-none transition-all shrink-0 disabled:opacity-20"
              style={{ background: c, color: "#000", boxShadow: input.trim() ? `0 0 12px ${neon.glow}` : "none" }}>+</button>
          </div>

          {visibleTodos.length === 0 ? (
            <div className="py-16 text-center text-xs" style={{ color: textMuted }}>タスクがありません</div>
          ) : (
            <ul ref={listRef}>
              {visibleTodos.map((todo, index) => (
                <li key={todo.id} draggable
                  onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)} onDragEnd={handleDragEnd}
                  onTouchStart={() => handleTouchStart(index)} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                  className="flex items-center gap-3 px-4 py-3 group cursor-grab active:cursor-grabbing select-none transition-colors"
                  style={{
                    borderBottom: index !== visibleTodos.length - 1 ? divider : "none",
                    background: dragOverIndex === index ? `rgba(${c.slice(1).match(/.{2}/g)?.map(x=>parseInt(x,16)).join(",")},0.1)` : "transparent",
                    borderTop: dragOverIndex === index ? `2px solid ${c}` : undefined,
                  }}
                >
                  <span className="shrink-0 transition-colors" style={{ color: "rgba(255,255,255,0.15)" }}>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="7" cy="5" r="1.5"/><circle cx="13" cy="5" r="1.5"/>
                      <circle cx="7" cy="10" r="1.5"/><circle cx="13" cy="10" r="1.5"/>
                      <circle cx="7" cy="15" r="1.5"/><circle cx="13" cy="15" r="1.5"/>
                    </svg>
                  </span>
                  <button onClick={() => toggleTodo(todo.id)}
                    className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                    style={todo.completed ? { background: c, borderColor: c, boxShadow: `0 0 8px ${neon.glow}` } : { borderColor: "rgba(255,255,255,0.2)" }}
                    aria-label={todo.completed ? "未完了に戻す" : "完了にする"}>
                    {todo.completed && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#000" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                  </button>
                  <span className="flex-1 text-sm leading-relaxed transition-colors"
                    style={{ color: todo.completed ? textMuted : textMain, textDecoration: todo.completed ? "line-through" : "none" }}>
                    {todo.text}
                  </span>
                  {activeTab === "すべて" && <span className="text-xs shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>{todo.tab}</span>}
                  <button onClick={() => deleteTodo(todo.id)}
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    style={{ color: "rgba(255,255,255,0.3)" }} aria-label="削除">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {visibleTodos.some((t) => t.completed) && (
            <div className="px-4 py-3 flex justify-end" style={{ borderTop: divider }}>
              <button onClick={() => { const ids = visibleTodos.filter((t) => t.completed).map((t) => t.id); setTodos((prev) => prev.filter((t) => !ids.includes(t.id))); }}
                className="text-xs transition-colors" style={{ color: "rgba(255,255,255,0.25)" }}>
                完了済みをすべて削除
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
