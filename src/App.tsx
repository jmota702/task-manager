import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import type { Task } from "./types";

import { DndContext, DragOverlay, useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ================= COLORS ================= */
const COLORS = {
  bgTop: "#0a2540",
  bgBottom: "#08182e",
  card: "rgba(30, 58, 95, 0.95)",
  border: "#1e3a5f",
  aqua: "#2dd4bf",
  orange: "#fb923c",
  white: "#f8fafc",
};

/* ================= INPUT STYLE ================= */
const inputStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #1e3a5f",
  background: "rgba(19, 41, 75, 0.75)",
  color: "#f8fafc",
  outline: "none",
  width: "160px",
};

/* ================= SORTABLE TASK ================= */
function SortableTask({ task, onDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const [confirming, setConfirming] = useState(false);

  const isOverdue =
    task.due_date && new Date(task.due_date) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        background: COLORS.card,
        padding: "12px",
        marginBottom: "10px",
        borderRadius: "10px",
        color: COLORS.white,
        border: isOverdue
          ? "1px solid rgba(239,68,68,0.7)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: isOverdue
          ? "0 0 10px rgba(239,68,68,0.6), 0 0 20px rgba(239,68,68,0.4)"
          : "0 4px 12px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div {...attributes} {...listeners} style={{ cursor: "grab", flex: 1 }}>
          <strong>{task.title}</strong>

          {task.description && (
            <div style={{ fontSize: "12px", opacity: 0.8 }}>
              {task.description}
            </div>
          )}

          {task.priority && (
            <div
              style={{
                fontSize: "11px",
                marginTop: "4px",
                color:
                  task.priority === "high"
                    ? "#ef4444"
                    : task.priority === "normal"
                    ? "#f59e0b"
                    : "#10b981",
              }}
            >
              {task.priority.toUpperCase()}
            </div>
          )}

          {task.due_date && (
            <div
              style={{
                fontSize: "12px",
                marginTop: "4px",
                color: isOverdue ? "#ef4444" : "#cbd5f5",
                fontWeight: isOverdue ? "600" : "normal",
              }}
            >
              {isOverdue
                ? `Overdue: ${task.due_date}`
                : `Due: ${task.due_date}`}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {confirming ? (
            <>
              <span style={{ fontSize: "11px", color: "#fca5a5" }}>
                Confirm?
              </span>

              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onDelete(task.id)}
                style={{
                  background: "#ef4444",
                  border: "none",
                  color: "white",
                  borderRadius: "6px",
                  padding: "2px 6px",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                Yes
              </button>

              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setConfirming(false)}
                style={{
                  background: "transparent",
                  border: "1px solid #64748b",
                  color: "#cbd5f5",
                  borderRadius: "6px",
                  padding: "2px 6px",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                No
              </button>
            </>
          ) : (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setConfirming(true)}
              style={{
                background: "transparent",
                border: "none",
                color: COLORS.orange,
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= COLUMN ================= */
function Column({ status, tasks, onDelete }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      style={{
        background: "rgba(8, 24, 46, 0.7)",
        padding: "14px",
        borderRadius: "14px",
        minHeight: "240px",
        border: `1px solid ${COLORS.border}`,
        boxShadow: isOver
          ? "0 0 10px rgba(251,146,60,0.7), 0 0 22px rgba(251,146,60,0.5)"
          : "0 6px 16px rgba(0,0,0,0.25)",
      }}
    >
      <h3 style={{ color: COLORS.aqua }}>
        {status.replace("_", " ").toUpperCase()}
      </h3>

      <SortableContext
        items={tasks.map((t: Task) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task: Task) => (
          <SortableTask key={task.id} task={task} onDelete={onDelete} />
        ))}
      </SortableContext>
    </div>
  );
}

/* ================= APP ================= */
function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [search, setSearch] = useState("");
  const [newTask, setNewTask] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");

  const statuses: Task["status"][] = [
    "todo",
    "in_progress",
    "in_review",
    "done",
  ];

  // ✅ COUNTER LOGIC (restored)
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === "in_progress"
  ).length;
  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < new Date();
  }).length;

  useEffect(() => {
    async function ensureGuest() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        await supabase.auth.signInAnonymously();
      }
    }
    ensureGuest();
  }, []);

  async function fetchTasks() {
    const { data } = await supabase.from("tasks").select("*");
    setTasks(data || []);
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  async function createTask() {
    if (!newTask.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase
      .from("tasks")
      .insert({
        title: newTask.trim(),
        description,
        priority,
        status: "todo",
        user_id: userData.user.id,
        due_date: dueDate || null,
      })
      .select()
      .single();

    setTasks((prev) => [...prev, data]);

    setNewTask("");
    setDescription("");
    setPriority("normal");
    setDueDate("");
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  }

  async function updateTaskStatus(taskId: string, newStatus: Task["status"]) {
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
  }

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DndContext
      onDragStart={({ active }) => {
        const t = tasks.find((x) => x.id === active.id);
        setActiveTask(t || null);
      }}
      onDragEnd={({ active, over }) => {
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (statuses.includes(overId as Task["status"])) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === activeId
                ? { ...t, status: overId as Task["status"] }
                : t
            )
          );
          updateTaskStatus(activeId, overId as Task["status"]);
        }
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          padding: "20px",
          background: `linear-gradient(180deg, ${COLORS.bgTop}, ${COLORS.bgBottom})`,
        }}
      >
        {/* HEADER + COUNTER */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <h1
  style={{
    fontSize: "30px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    margin: 0,
    background: "linear-gradient(90deg, #2dd4bf, #0ea5e9, #fb923c)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 0 10px rgba(45,212,191,0.25)",
  }}
>
  Task Board
</h1>

          <div style={{ display: "flex", gap: "20px", color: "#cbd5f5" }}>
            <span>Total: {totalTasks}</span>
            <span>Done: {doneTasks}</span>
            <span>In Progress: {inProgressTasks}</span>
            <span style={{ color: overdueTasks > 0 ? "#ef4444" : "#94a3b8" }}>
              Overdue: {overdueTasks}
            </span>
          </div>
        </div>

        {/* INPUT ROW */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <input value={newTask} onChange={(e)=>setNewTask(e.target.value)} placeholder="Title" style={inputStyle}/>
          <input value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Description" style={inputStyle}/>
          
     {/* PRIORITY LABEL */}
<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
    Priority
  </span>
  <select
    value={priority}
    onChange={(e) => setPriority(e.target.value)}
    style={{ ...inputStyle, width: "140px" }}
  >
    <option value="low">Low</option>
    <option value="normal">Normal</option>
    <option value="high">High</option>
  </select>
</div>

{/* DUE LABEL */}
<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
    Due
  </span>
  <input
    type="date"
    value={dueDate}
    onChange={(e) => setDueDate(e.target.value)}
    style={{ ...inputStyle, width: "140px" }}
  />
</div>
          
          <button onClick={createTask} style={{ padding: "10px", background: COLORS.aqua, border: "none", borderRadius: "8px" }}>
            Add
          </button>
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search..." style={inputStyle}/>
        </div>

        {/* BOARD */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
          {statuses.map((status) => (
            <Column key={status} status={status} tasks={filteredTasks.filter((t)=>t.status===status)} onDelete={deleteTask}/>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? <div>{activeTask.title}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}

export default App;