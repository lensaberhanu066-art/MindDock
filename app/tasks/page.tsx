"use client";

import { useEffect, useState } from "react";
import { apiRequest, resourceRequest, Task } from "../lib/api-client";
import LoadingState from "../components/LoadingState";
import { MAX_TASK_TITLE_LENGTH } from "../lib/input-limits";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    resourceRequest<Task[]>("tasks")
      .then((result) => {
        if (active) setTasks(result.data);
      })
      .catch((error: unknown) => {
        if (active) {
          setHasLoadError(true);
          setErrorMessage(error instanceof Error ? error.message : "Unable to load tasks.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const addTask = async () => {
    const trimmed = draft.trim();
    if (!trimmed || isMutating) return;

    setIsMutating(true);
    setErrorMessage("");
    try {
      const result = await resourceRequest<Task>("tasks", {
        method: "POST",
        body: JSON.stringify({ title: trimmed }),
      });
      setTasks((current) => [result.data, ...current]);
      setDraft("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to add this task.");
    } finally {
      setIsMutating(false);
    }
  };

  const toggleTask = async (task: Task) => {
    if (isMutating) return;
    setIsMutating(true);
    setErrorMessage("");
    try {
      const result = await resourceRequest<Task>("tasks", {
        method: "PATCH",
        body: JSON.stringify({ id: task.id, completed: !task.completed }),
      });
      setTasks((current) => current.map((item) => item.id === task.id ? result.data : item));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update this task.");
    } finally {
      setIsMutating(false);
    }
  };

  const removeTask = async (id: string) => {
    if (isMutating) return;
    setIsMutating(true);
    setErrorMessage("");
    try {
      await apiRequest(`/api/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to remove this task.");
    } finally {
      setIsMutating(false);
    }
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
            maxLength={MAX_TASK_TITLE_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && addTask()}
            placeholder="Add a new task..."
            className="task-input"
          />
          <button type="button" onClick={addTask} disabled={isMutating} className="primary-btn task-add-button">
            {isMutating ? "Saving..." : "Add task"}
          </button>
        </div>

        {errorMessage ? <p className="form-error" role="alert">{errorMessage}</p> : null}
        {isLoading ? (
          <LoadingState label="Loading tasks..." />
        ) : hasLoadError ? null : tasks.length === 0 ? (
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
                  disabled={isMutating}
                  className={`task-toggle ${task.completed ? "completed" : ""}`}
                >
                  <span>{task.completed ? "✓" : "○"}</span>
                  <span className={task.completed ? "task-completed" : ""}>
                    {task.title}
                  </span>
                </button>
                <button type="button" onClick={() => removeTask(task.id)} disabled={isMutating} className="secondary-btn task-remove-button">
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
