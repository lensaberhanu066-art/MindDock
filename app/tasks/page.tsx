"use client";

import { useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

const STORAGE_KEY = "minddock-tasks";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const stored = globalThis.window?.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch {
        setTasks([]);
      }
    }
  }, []);

  useEffect(() => {
    if (tasks.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [tasks]);

  const addTask = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    setTasks((current) => [
      { id: crypto.randomUUID(), title: trimmed, completed: false },
      ...current,
    ]);
    setDraft("");
  };

  const toggleTask = (id: string) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const removeTask = (id: string) => {
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
                  onClick={() => toggleTask(task.id)}
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
