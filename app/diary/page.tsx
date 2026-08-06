"use client";

import { useEffect, useState } from "react";

type DiaryEntry = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "minddock-diary";

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const stored = globalThis.window?.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch {
        setEntries([]);
      }
    }
  }, []);

  useEffect(() => {
    if (entries.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [entries]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
  };

  const saveEntry = () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) return;

    const now = new Date().toISOString();

    if (editingId) {
      setEntries((current) =>
        current.map((entry) =>
          entry.id === editingId
            ? { ...entry, title: trimmedTitle, content: trimmedContent, updatedAt: now }
            : entry
        )
      );
    } else {
      setEntries((current) => [
        {
          id: crypto.randomUUID(),
          title: trimmedTitle,
          content: trimmedContent,
          createdAt: now,
          updatedAt: now,
        },
        ...current,
      ]);
    }

    resetForm();
  };

  const startEditing = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
  };

  const removeEntry = (id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <section className="page">
      <div className="hero-copy">
        <h1>Diary</h1>
        <p className="subtext">
          Capture reflections, wins, and moments that matter in one place.
        </p>
      </div>

      <div className="task-board">
        <div className="task-form" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <label className="sr-only" htmlFor="diary-title">
            Entry title
          </label>
          <input
            id="diary-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Entry title"
            className="task-input"
          />

          <label className="sr-only" htmlFor="diary-content">
            Entry content
          </label>
          <textarea
            id="diary-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write about your day..."
            className="task-input"
            rows={6}
            style={{ resize: "vertical", minHeight: "140px" }}
          />

          <div className="flex gap-3 flex-wrap">
            <button type="button" onClick={saveEntry} className="primary-btn task-add-button">
              {editingId ? "Save changes" : "Add entry"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="secondary-btn task-remove-button">
                Cancel
              </button>
            )}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="item-card">
            <p>No diary entries yet. Add your first note to get started.</p>
          </div>
        ) : (
          <div className="list">
            {entries.map((entry) => (
              <article key={entry.id} className="item-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2>{entry.title}</h2>
                    <p className="mb-3 text-sm text-slate-400">
                      {new Date(entry.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEditing(entry)} className="secondary-btn">
                      Edit
                    </button>
                    <button type="button" onClick={() => removeEntry(entry.id)} className="secondary-btn">
                      Remove
                    </button>
                  </div>
                </div>
                <p style={{ whiteSpace: "pre-wrap" }}>{entry.content}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
