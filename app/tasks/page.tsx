"use client";

import { useEffect, useState } from "react";
import { apiRequest, resourceRequest, Task } from "../lib/api-client";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    resourceRequest<Task[]>("tasks").then((result) => setTasks(result.data)).catch(() => setTasks([]));
  }, []);

  const addTask = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    try {
      const result = await resourceRequest<Task>("tasks", {
        method: "POST",
        body: JSON.stringify({ title: trimmed }),
      });
      setTasks((current) => [result.data, ...current]);
      setDraft("");
    } catch {
      return;
    }
  };

  const toggleTask = async (task: Task) => {
    const result = await resourceRequest<Task>("tasks", {
      method: "PATCH",
      body: JSON.stringify({ id: task.id, completed: !task.completed }),
    });
    setTasks((current) => current.map((item) => item.id === task.id ? result.data : item));
  };

  const removeTask = async (id: string) => {
    await apiRequest(`/api/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setTasks((current) => current.filter((task) => task.id !== id));
  };

  return (
    <section className="page">
      <div className="hero-copy">
        <h1>Task List</h1>
        <p className="subtext">
          Track your priorities and build momentum with a simple daily checklist.
        </p>
      </div>

      <div className="task-board">
        <div className="task-form">
          <label className="sr-only" htmlFor="task-input">
            New task title
          </label>
          <input
            id="task-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && addTask()}
            placeholder="Add a new task..."
            className="task-input"
          />
          <button type="button" onClick={addTask} className="primary-btn task-add-button">
            Add task
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="item-card">
            <p>No tasks yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="list">
            {tasks.map((task) => (
              <article key={task.id} className="item-card task-row">
                <button
                  type="button"
                  onClick={() => toggleTask(task)}
                  className={`task-toggle ${task.completed ? "completed" : ""}`}
                >
                  <span>{task.completed ? "✓" : "○"}</span>
                  <span className={task.completed ? "task-completed" : ""}>
                    {task.title}
                  </span>
                </button>
                <button type="button" onClick={() => removeTask(task.id)} className="secondary-btn task-remove-button">
                  Remove
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
