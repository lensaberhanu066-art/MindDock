"use client";

import { useEffect, useState } from "react";
import { apiRequest, DiaryEntry, resourceRequest } from "../lib/api-client";

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    resourceRequest<DiaryEntry[]>("diary").then((result) => setEntries(result.data)).catch(() => setEntries([]));
  }, []);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
  };

  const saveEntry = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) return;

    const result = await resourceRequest<DiaryEntry>("diary", {
      method: editingId ? "PATCH" : "POST",
      body: JSON.stringify({ id: editingId, title: trimmedTitle, content: trimmedContent }),
    });
    setEntries((current) => editingId
      ? current.map((entry) => entry.id === editingId ? result.data : entry)
      : [result.data, ...current]);
    resetForm();
  };

  const startEditing = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
  };

  const removeEntry = async (id: string) => {
    await apiRequest(`/api/diary?id=${encodeURIComponent(id)}`, { method: "DELETE" });
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
        <div className="task-form task-form--stacked">
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
            className="task-input task-textarea"
            rows={6}
          />

          <div className="form-actions">
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
                <div className="entry-header">
                  <div>
                    <h2>{entry.title}</h2>
                    <p className="entry-meta">
                      {new Date(entry.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="entry-actions">
                    <button type="button" onClick={() => startEditing(entry)} className="secondary-btn">
                      Edit
                    </button>
                    <button type="button" onClick={() => removeEntry(entry.id)} className="secondary-btn">
                      Remove
                    </button>
                  </div>
                </div>
                <p className="entry-body">{entry.content}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
